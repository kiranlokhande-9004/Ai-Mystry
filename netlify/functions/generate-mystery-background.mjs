import { getDatabase } from '@netlify/database';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const db = getDatabase();
const MODEL = 'gemini-3.8-flash';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const caseShape = z.object({
  caseTitle: z.string().min(4), difficulty: z.string(), category: z.string(),
  caseOverview: z.object({ description: z.string(), location: z.string(), incidentDate: z.string(), incidentTime: z.string(), victim: z.object({ name: z.string(), age: z.number(), occupation: z.string() }) }),
  suspects: z.array(z.object({ id: z.string(), name: z.string(), age: z.number(), occupation: z.string(), relationshipToVictim: z.string(), statement: z.string(), motive: z.string(), avatarPrompt: z.string() })).min(2),
  timeline: z.array(z.object({ time: z.string(), event: z.string() })),
  evidence: z.array(z.object({ id: z.string(), type: z.string(), title: z.string(), description: z.string(), timestamp: z.string(), relatedSuspects: z.array(z.string()), content: z.record(z.unknown()) })).min(3),
  solution: z.object({ culpritId: z.string(), motive: z.string(), method: z.string(), explanation: z.string(), keyEvidenceIds: z.array(z.string()).min(3), redHerrings: z.array(z.string()) }),
});

const parse = (value) => (typeof value === 'string' ? JSON.parse(value) : value);

async function generateCase({ scenario, difficulty, suspectCount, category }) {
  const ai = new GoogleGenAI({});
  const prompt = `Create a logically consistent, entirely fictional detective investigation. Return only JSON matching this schema: {"caseTitle":string,"difficulty":string,"category":string,"caseOverview":{"description":string,"location":string,"incidentDate":string,"incidentTime":string,"victim":{"name":string,"age":number,"occupation":string}},"suspects":[{"id":string,"name":string,"age":number,"occupation":string,"relationshipToVictim":string,"statement":string,"motive":string,"avatarPrompt":string}],"timeline":[{"time":string,"event":string}],"evidence":[{"id":string,"type":string,"title":string,"description":string,"timestamp":string,"relatedSuspects":[string],"content":object}],"solution":{"culpritId":string,"motive":string,"method":string,"explanation":string,"keyEvidenceIds":[string],"redHerrings":[string]}}. Requirements: exactly ${suspectCount} suspects with IDs S001 onward; one culprit who is a suspect; at least 3 unique evidence items with IDs E001 onward; at least 3 existing evidence IDs support the answer; dates and timeline agree; difficulty ${difficulty} controls clue subtlety; category ${category}; don't contradict established facts; keep chats, reports, and all case details fictional. User premise: ${scenario}`;
  const response = await ai.models.generateContent({ model: MODEL, contents: prompt, config: { responseMimeType: 'application/json' } });
  const data = caseShape.parse(JSON.parse(response.text));
  const suspectIds = data.suspects.map((s) => s.id);
  const evidenceIds = data.evidence.map((e) => e.id);
  if (suspectIds.length !== suspectCount || new Set(suspectIds).size !== suspectIds.length || !suspectIds.includes(data.solution.culpritId) || new Set(evidenceIds).size !== evidenceIds.length || data.solution.keyEvidenceIds.some((id) => !evidenceIds.includes(id))) {
    throw new Error('Generated case failed consistency checks.');
  }
  return data;
}

export default async (req) => {
  let jobId;
  try { ({ jobId } = await req.json()); } catch { return; }
  if (typeof jobId !== 'string' || !UUID.test(jobId)) return;

  // Claim the job atomically so it is only processed once.
  const [job] = await db.sql`UPDATE generation_jobs SET status = 'running', updated_at = NOW() WHERE id = ${jobId} AND status = 'pending' RETURNING input`;
  if (!job) return;
  const input = parse(job.input);

  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const data = await generateCase(input);
      const [mystery] = await db.sql`
        INSERT INTO mysteries (case_title, category, difficulty, case_overview, suspects, timeline, evidence, solution)
        VALUES (${data.caseTitle}, ${data.category}, ${data.difficulty}, ${JSON.stringify(data.caseOverview)}::jsonb,
          ${JSON.stringify(data.suspects)}::jsonb, ${JSON.stringify(data.timeline)}::jsonb,
          ${JSON.stringify(data.evidence)}::jsonb, ${JSON.stringify(data.solution)}::jsonb)
        RETURNING id`;
      await db.sql`UPDATE generation_jobs SET status = 'completed', mystery_id = ${mystery.id}, updated_at = NOW() WHERE id = ${jobId}`;
      return;
    } catch (error) {
      lastError = error;
      console.error(`Mystery generation attempt ${attempt + 1} failed:`, error?.message);
    }
  }

  const message = String(lastError?.message || '');
  let userMessage = 'The case could not be generated. Please try again.';
  if (lastError?.name === 'ZodError' || lastError instanceof SyntaxError || /consistency checks/i.test(message)) {
    userMessage = 'The AI returned case data that failed validation. Try generating again; if it repeats, simplify the premise.';
  } else if (lastError?.status === 429 || /429|rate limit/i.test(message)) {
    userMessage = 'The case generator is busy right now. Wait a moment and try again.';
  }
  await db.sql`UPDATE generation_jobs SET status = 'failed', error = ${userMessage}, updated_at = NOW() WHERE id = ${jobId}`;
};

export const config = {
  background: true,
};
