import type { Config } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/index.js";
import { investigations, mysteries } from "../../db/schema.js";

const MODEL = "gemini-3.8-flash";

const generationInput = z.object({
  scenario: z.string().trim().min(20).max(1600),
  difficulty: z.enum(["easy", "medium", "hard", "expert"]),
  suspectCount: z.number().int().min(2).max(6),
  category: z.enum(["murder", "theft", "disappearance", "sabotage", "other"]),
});

const caseShape = z.object({
  caseTitle: z.string().min(4), difficulty: z.string(), category: z.string(),
  caseOverview: z.object({ description: z.string(), location: z.string(), incidentDate: z.string(), incidentTime: z.string(), victim: z.object({ name: z.string(), age: z.number(), occupation: z.string() }) }),
  suspects: z.array(z.object({ id: z.string(), name: z.string(), age: z.number(), occupation: z.string(), relationshipToVictim: z.string(), statement: z.string(), motive: z.string(), avatarPrompt: z.string() })).min(2),
  timeline: z.array(z.object({ time: z.string(), event: z.string() })),
  evidence: z.array(z.object({ id: z.string(), type: z.string(), title: z.string(), description: z.string(), timestamp: z.string(), relatedSuspects: z.array(z.string()), content: z.record(z.unknown()) })).min(3),
  solution: z.object({ culpritId: z.string(), motive: z.string(), method: z.string(), explanation: z.string(), keyEvidenceIds: z.array(z.string()).min(3), redHerrings: z.array(z.string()) }),
});

const progressInput = z.object({
  openedEvidenceIds: z.array(z.string().max(50)).max(200).default([]),
  bookmarkedEvidenceIds: z.array(z.string().max(50)).max(200).default([]),
  investigationNotes: z.string().max(5000).default(""),
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Mystery = typeof mysteries.$inferSelect;
type Investigation = typeof investigations.$inferSelect;

const ok = (data: unknown, status = 200) => Response.json({ success: true, data }, { status });
const fail = (message: string, status: number) => Response.json({ success: false, message }, { status });

const publicMystery = (m: Mystery) => ({
  mysteryId: m.id, caseTitle: m.caseTitle, category: m.category, difficulty: m.difficulty,
  caseOverview: m.caseOverview, suspects: m.suspects, timeline: m.timeline, evidence: m.evidence,
});

const publicInvestigation = (i: Investigation) => ({ _id: i.id, ...i });

async function readJson(req: Request) {
  try { return await req.json(); } catch { return {}; }
}

async function findMystery(id: string) {
  if (!UUID.test(id)) return null;
  const [m] = await db.select().from(mysteries).where(eq(mysteries.id, id));
  return m ?? null;
}

async function findInvestigation(id: string) {
  if (!UUID.test(id)) return null;
  const [i] = await db.select().from(investigations).where(eq(investigations.id, id));
  return i ?? null;
}

async function generateMystery(req: Request) {
  const parsed = generationInput.safeParse(await readJson(req));
  if (!parsed.success) return fail("Add a scenario of at least 20 characters and choose valid case settings.", 400);
  const { scenario, difficulty, suspectCount, category } = parsed.data;
  const prompt = `Create a logically consistent, entirely fictional detective investigation. Return only JSON matching this schema: {"caseTitle":string,"difficulty":string,"category":string,"caseOverview":{"description":string,"location":string,"incidentDate":string,"incidentTime":string,"victim":{"name":string,"age":number,"occupation":string}},"suspects":[{"id":string,"name":string,"age":number,"occupation":string,"relationshipToVictim":string,"statement":string,"motive":string,"avatarPrompt":string}],"timeline":[{"time":string,"event":string}],"evidence":[{"id":string,"type":string,"title":string,"description":string,"timestamp":string,"relatedSuspects":[string],"content":object}],"solution":{"culpritId":string,"motive":string,"method":string,"explanation":string,"keyEvidenceIds":[string],"redHerrings":[string]}}. Requirements: exactly ${suspectCount} suspects with IDs S001 onward; one culprit who is a suspect; at least 3 unique evidence items with IDs E001 onward; at least 3 existing evidence IDs support the answer; dates and timeline agree; difficulty ${difficulty} controls clue subtlety; category ${category}; don't contradict established facts; keep chats, reports, and all case details fictional. User premise: ${scenario}`;
  try {
    const ai = new GoogleGenAI({});
    const response = await ai.models.generateContent({ model: MODEL, contents: prompt, config: { responseMimeType: "application/json" } });
    const data = caseShape.parse(JSON.parse(response.text ?? ""));
    const suspectIds = data.suspects.map((s) => s.id);
    const evidenceIds = data.evidence.map((e) => e.id);
    if (suspectIds.length !== suspectCount || new Set(suspectIds).size !== suspectIds.length || !suspectIds.includes(data.solution.culpritId) || new Set(evidenceIds).size !== evidenceIds.length || data.solution.keyEvidenceIds.some((id) => !evidenceIds.includes(id))) {
      throw new Error("Generated case failed consistency checks.");
    }
    const [saved] = await db.insert(mysteries).values(data).returning();
    return ok(publicMystery(saved), 201);
  } catch (error: any) {
    console.error("Mystery generation failed:", error?.cause?.message || error?.message);
    const message = String(error?.message || "");
    if (error?.name === "ZodError" || error instanceof SyntaxError || /consistency checks/i.test(message)) {
      return fail("The AI returned case data that failed validation. Try generating again; if it repeats, simplify the premise.", 502);
    }
    return fail("The case could not be generated right now. Please try again.", 502);
  }
}

async function startInvestigation(req: Request) {
  const { mysteryId } = await readJson(req);
  if (typeof mysteryId !== "string" || !(await findMystery(mysteryId))) return fail("Mystery not found.", 404);
  const [created] = await db.insert(investigations).values({ mysteryId }).returning();
  return ok({ investigationId: created.id }, 201);
}

async function saveProgress(req: Request, id: string) {
  const parsed = progressInput.safeParse(await readJson(req));
  if (!parsed.success) return fail("Invalid progress update.", 400);
  if (!UUID.test(id)) return fail("Investigation not found.", 404);
  const [updated] = await db.update(investigations)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(investigations.id, id))
    .returning();
  if (!updated) return fail("Investigation not found.", 404);
  return ok(publicInvestigation(updated));
}

async function submitVerdict(req: Request, id: string) {
  const { selectedSuspectId } = await readJson(req);
  const investigation = await findInvestigation(id);
  if (!investigation) return fail("Investigation not found.", 404);
  if (investigation.isCompleted) return fail("A verdict has already been submitted.", 409);
  const mystery = await findMystery(investigation.mysteryId);
  if (!mystery) return fail("Mystery not found.", 404);
  const selected = mystery.suspects.find((s) => s.id === selectedSuspectId);
  if (!selected) return fail("Choose a valid suspect.", 400);
  const solution = mystery.solution;
  const correct = selected.id === solution.culpritId;
  const opened = new Set(investigation.openedEvidenceIds).size;
  const exploredPoints = Math.round(Math.min(opened, mystery.evidence.length) / mystery.evidence.length * 20);
  const score = (correct ? 70 : 0) + exploredPoints;
  await db.update(investigations)
    .set({ selectedSuspectId: selected.id, isCompleted: true, submittedAt: new Date(), score, updatedAt: new Date() })
    .where(eq(investigations.id, id));
  return ok({
    correct, score,
    actualCulprit: mystery.suspects.find((s) => s.id === solution.culpritId),
    explanation: solution.explanation, motive: solution.motive, method: solution.method,
    keyEvidence: (solution.keyEvidenceIds as string[]).map((eid) => mystery.evidence.find((e) => e.id === eid)).filter(Boolean),
  });
}

export default async (req: Request) => {
  const path = new URL(req.url).pathname.replace(/^\/api\/v1/, "").replace(/\/+$/, "");
  const parts = path.split("/").filter(Boolean);
  const method = req.method;

  try {
    if (method === "GET" && path === "/health") return ok({ api: "ok", database: "connected", generationReady: true });
    if (method === "POST" && path === "/mysteries/generate") return await generateMystery(req);
    if (method === "GET" && parts[0] === "mysteries" && parts.length === 2) {
      const m = await findMystery(parts[1]);
      return m ? ok(publicMystery(m)) : fail("Mystery not found.", 404);
    }
    if (method === "POST" && path === "/investigations") return await startInvestigation(req);
    if (parts[0] === "investigations" && parts.length === 2 && method === "GET") {
      const i = await findInvestigation(parts[1]);
      return i ? ok(publicInvestigation(i)) : fail("Investigation not found.", 404);
    }
    if (parts[0] === "investigations" && parts[2] === "progress" && parts.length === 3 && method === "PATCH") return await saveProgress(req, parts[1]);
    if (parts[0] === "investigations" && parts[2] === "verdict" && parts.length === 3 && method === "POST") return await submitVerdict(req, parts[1]);
    return fail("Not found.", 404);
  } catch (error: any) {
    console.error("API error:", error?.cause?.message || error?.message);
    return fail("Something went wrong. Please try again.", 500);
  }
};

export const config: Config = {
  path: "/api/v1/*",
};
