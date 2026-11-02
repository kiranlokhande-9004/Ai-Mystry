import { getDatabase } from '@netlify/database';
import { z } from 'zod';

const db = getDatabase();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const generationInput = z.object({
  scenario: z.string().trim().min(20).max(1600),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
  suspectCount: z.number().int().min(2).max(6),
  category: z.enum(['murder', 'theft', 'disappearance', 'sabotage', 'other']),
});

const json = (data, status = 200) => Response.json({ success: true, data }, { status });
const fail = (message, status = 400) => Response.json({ success: false, message }, { status });
const parse = (value) => (typeof value === 'string' ? JSON.parse(value) : value);

const publicMystery = (row) => ({
  mysteryId: row.id, caseTitle: row.case_title, category: row.category, difficulty: row.difficulty,
  caseOverview: parse(row.case_overview), suspects: parse(row.suspects), timeline: parse(row.timeline), evidence: parse(row.evidence),
});

const publicInvestigation = (row) => ({
  _id: row.id, investigationId: row.id, mysteryId: row.mystery_id,
  openedEvidenceIds: parse(row.opened_evidence_ids), bookmarkedEvidenceIds: parse(row.bookmarked_evidence_ids),
  investigationNotes: row.investigation_notes, selectedSuspectId: row.selected_suspect_id,
  submittedAt: row.submitted_at, isCompleted: row.is_completed, score: row.score,
  createdAt: row.created_at, updatedAt: row.updated_at,
});

async function readBody(req) {
  try { return await req.json(); } catch { return {}; }
}

async function generateMystery(req) {
  const parsed = generationInput.safeParse(await readBody(req));
  if (!parsed.success) return fail('Add a scenario of at least 20 characters and choose valid case settings.');
  const [job] = await db.sql`INSERT INTO generation_jobs (input) VALUES (${JSON.stringify(parsed.data)}::jsonb) RETURNING id`;
  const origin = new URL(req.url).origin;
  const kick = await fetch(`${origin}/.netlify/functions/generate-mystery-background`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: job.id }),
  }).catch((error) => { console.error('Could not start generation:', error?.message); return null; });
  if (!kick || (kick.status !== 202 && !kick.ok)) {
    await db.sql`UPDATE generation_jobs SET status = 'failed', error = 'The case generator could not be started.', updated_at = NOW() WHERE id = ${job.id}`;
    return fail('The case generator could not be started. Please try again.', 502);
  }
  return json({ jobId: job.id, status: 'pending' }, 202);
}

async function getGenerationJob(id) {
  if (!UUID.test(id)) return fail('Invalid job ID.');
  const [job] = await db.sql`SELECT id, status, mystery_id, error, created_at FROM generation_jobs WHERE id = ${id}`;
  if (!job) return fail('Generation job not found.', 404);
  if (job.status === 'completed' && job.mystery_id) {
    const [row] = await db.sql`SELECT id, case_title, category, difficulty, case_overview, suspects, timeline, evidence FROM mysteries WHERE id = ${job.mystery_id}`;
    return json({ jobId: job.id, status: 'completed', mystery: publicMystery(row) });
  }
  const stale = job.status === 'pending' && Date.now() - new Date(job.created_at).getTime() > 16 * 60 * 1000;
  if (job.status === 'failed' || stale) return json({ jobId: job.id, status: 'failed', message: job.error || 'Case generation timed out. Please try again.' });
  return json({ jobId: job.id, status: 'pending' });
}

async function getMystery(id) {
  if (!UUID.test(id)) return fail('Invalid mystery ID.');
  const [row] = await db.sql`SELECT id, case_title, category, difficulty, case_overview, suspects, timeline, evidence FROM mysteries WHERE id = ${id}`;
  return row ? json(publicMystery(row)) : fail('Mystery not found.', 404);
}

async function startInvestigation(req) {
  const { mysteryId } = await readBody(req);
  if (typeof mysteryId !== 'string' || !UUID.test(mysteryId)) return fail('Could not start investigation.');
  const [mystery] = await db.sql`SELECT id FROM mysteries WHERE id = ${mysteryId}`;
  if (!mystery) return fail('Mystery not found.', 404);
  const [row] = await db.sql`INSERT INTO investigations (mystery_id) VALUES (${mysteryId}) RETURNING id`;
  return json({ investigationId: row.id }, 201);
}

async function getInvestigation(id) {
  if (!UUID.test(id)) return fail('Invalid investigation ID.');
  const [row] = await db.sql`SELECT * FROM investigations WHERE id = ${id}`;
  return row ? json(publicInvestigation(row)) : fail('Investigation not found.', 404);
}

const idList = (value) => Array.isArray(value) && value.length <= 200 && value.every((v) => typeof v === 'string' && v.length <= 64);

async function saveProgress(id, req) {
  if (!UUID.test(id)) return fail('Invalid investigation ID.');
  const { openedEvidenceIds = [], bookmarkedEvidenceIds = [], investigationNotes = '' } = await readBody(req);
  if (!idList(openedEvidenceIds) || !idList(bookmarkedEvidenceIds) || typeof investigationNotes !== 'string' || investigationNotes.length > 5000) {
    return fail('Invalid progress update.');
  }
  const [row] = await db.sql`
    UPDATE investigations SET
      opened_evidence_ids = ${JSON.stringify(openedEvidenceIds)}::jsonb,
      bookmarked_evidence_ids = ${JSON.stringify(bookmarkedEvidenceIds)}::jsonb,
      investigation_notes = ${investigationNotes},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *`;
  return row ? json(publicInvestigation(row)) : fail('Investigation not found.', 404);
}

async function submitVerdict(id, req) {
  if (!UUID.test(id)) return fail('Invalid investigation ID.');
  const { selectedSuspectId } = await readBody(req);
  const [investigation] = await db.sql`SELECT * FROM investigations WHERE id = ${id}`;
  if (!investigation) return fail('Investigation not found.', 404);
  if (investigation.is_completed) return fail('A verdict has already been submitted.', 409);
  const [mystery] = await db.sql`SELECT suspects, evidence, solution FROM mysteries WHERE id = ${investigation.mystery_id}`;
  if (!mystery) return fail('Mystery not found.', 404);
  const suspects = parse(mystery.suspects);
  const evidence = parse(mystery.evidence);
  const solution = parse(mystery.solution);
  const selected = suspects.find((s) => s.id === selectedSuspectId);
  if (!selected) return fail('Choose a valid suspect.');
  const correct = selected.id === solution.culpritId;
  const opened = parse(investigation.opened_evidence_ids) || [];
  const exploredPoints = Math.round(Math.min(opened.length, evidence.length) / evidence.length * 20);
  const score = (correct ? 70 : 0) + exploredPoints;
  const [updated] = await db.sql`
    UPDATE investigations SET selected_suspect_id = ${selected.id}, is_completed = TRUE, submitted_at = NOW(), score = ${score}, updated_at = NOW()
    WHERE id = ${id} AND is_completed = FALSE
    RETURNING id`;
  if (!updated) return fail('A verdict has already been submitted.', 409);
  return json({
    correct, score,
    actualCulprit: suspects.find((s) => s.id === solution.culpritId),
    explanation: solution.explanation, motive: solution.motive, method: solution.method,
    keyEvidence: solution.keyEvidenceIds.map((eid) => evidence.find((e) => e.id === eid)).filter(Boolean),
  });
}

export default async (req) => {
  const path = new URL(req.url).pathname.replace(/^\/api\/v1/, '').replace(/\/$/, '');
  const parts = path.split('/').filter(Boolean);
  const method = req.method;
  try {
    if (parts[0] === 'health' && method === 'GET') {
      let database = 'connected';
      try { await db.sql`SELECT 1`; } catch { database = 'disconnected'; }
      return json({ api: 'ok', database, generationReady: true });
    }
    if (parts[0] === 'mysteries') {
      if (parts[1] === 'generate' && parts.length === 2 && method === 'POST') return await generateMystery(req);
      if (parts[1] === 'jobs' && parts.length === 3 && method === 'GET') return await getGenerationJob(parts[2]);
      if (parts.length === 2 && method === 'GET') return await getMystery(parts[1]);
    }
    if (parts[0] === 'investigations') {
      if (parts.length === 1 && method === 'POST') return await startInvestigation(req);
      if (parts.length === 2 && method === 'GET') return await getInvestigation(parts[1]);
      if (parts.length === 3 && parts[2] === 'progress' && method === 'PATCH') return await saveProgress(parts[1], req);
      if (parts.length === 3 && parts[2] === 'verdict' && method === 'POST') return await submitVerdict(parts[1], req);
    }
    return fail('Not found.', 404);
  } catch (error) {
    console.error('API error:', error?.message);
    return fail('Something went wrong. Please try again.', 500);
  }
};

export const config = {
  path: ['/api/v1', '/api/v1/*'],
};
