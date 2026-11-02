import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const app = express();
const port = Number(process.env.PORT || 5000);
const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
const geminiConfigured = Boolean(geminiApiKey && !/^(your_|placeholder|replace_me|<)/i.test(geminiApiKey));
app.use(cors({ origin: process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '32kb' }));

const suspectSchema = new mongoose.Schema({
  id: String, name: String, age: Number, occupation: String,
  relationshipToVictim: String, statement: String, motive: String, avatarPrompt: String,
}, { _id: false });
const evidenceSchema = new mongoose.Schema({
  id: String, type: String, title: String, description: String,
  timestamp: String, relatedSuspects: [String], content: mongoose.Schema.Types.Mixed,
}, { _id: false });
const mysterySchema = new mongoose.Schema({
  caseTitle: { type: String, required: true }, category: String, difficulty: String,
  caseOverview: mongoose.Schema.Types.Mixed, suspects: [suspectSchema], timeline: [mongoose.Schema.Types.Mixed],
  evidence: [evidenceSchema], solution: { type: mongoose.Schema.Types.Mixed, select: false },
}, { timestamps: true });
const investigationSchema = new mongoose.Schema({
  mysteryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mystery', required: true },
  openedEvidenceIds: [String], bookmarkedEvidenceIds: [String], investigationNotes: { type: String, default: '' },
  selectedSuspectId: String, submittedAt: Date, isCompleted: { type: Boolean, default: false }, score: Number,
}, { timestamps: true });
const Mystery = mongoose.models.Mystery || mongoose.model('Mystery', mysterySchema);
const Investigation = mongoose.models.Investigation || mongoose.model('Investigation', investigationSchema);

const generationInput = z.object({
  scenario: z.string().trim().min(20).max(1600),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
  suspectCount: z.number().int().min(2).max(6),
  category: z.enum(['murder', 'theft', 'disappearance', 'sabotage', 'other']),
});

const caseShape = z.object({
  caseTitle: z.string().min(4), difficulty: z.string(), category: z.string(),
  caseOverview: z.object({ description: z.string(), location: z.string(), incidentDate: z.string(), incidentTime: z.string(), victim: z.object({ name: z.string(), age: z.number(), occupation: z.string() }) }),
  suspects: z.array(z.object({ id: z.string(), name: z.string(), age: z.number(), occupation: z.string(), relationshipToVictim: z.string(), statement: z.string(), motive: z.string(), avatarPrompt: z.string() })).min(2),
  timeline: z.array(z.object({ time: z.string(), event: z.string() })),
  evidence: z.array(z.object({ id: z.string(), type: z.string(), title: z.string(), description: z.string(), timestamp: z.string(), relatedSuspects: z.array(z.string()), content: z.record(z.unknown()) })).min(3),
  solution: z.object({ culpritId: z.string(), motive: z.string(), method: z.string(), explanation: z.string(), keyEvidenceIds: z.array(z.string()).min(3), redHerrings: z.array(z.string()) }),
});

const publicMystery = (m) => ({
  mysteryId: m._id, caseTitle: m.caseTitle, category: m.category, difficulty: m.difficulty,
  caseOverview: m.caseOverview, suspects: m.suspects, timeline: m.timeline, evidence: m.evidence,
});

app.get('/api/v1/health', (_req, res) => res.json({
  success: true, data: { api: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', generationReady: geminiConfigured },
}));

app.post('/api/v1/mysteries/generate', async (req, res) => {
  const parsed = generationInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Add a scenario of at least 20 characters and choose valid case settings.' });
  if (!geminiConfigured) return res.status(503).json({ success: false, message: 'Mystery generation is not configured yet. Add a valid GEMINI_API_KEY to server/.env, then restart the backend.' });
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ success: false, message: 'MongoDB is not connected. Start MongoDB and try again.' });
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const { scenario, difficulty, suspectCount, category } = parsed.data;
    const prompt = `Create a logically consistent, entirely fictional detective investigation. Return only JSON matching this schema: {"caseTitle":string,"difficulty":string,"category":string,"caseOverview":{"description":string,"location":string,"incidentDate":string,"incidentTime":string,"victim":{"name":string,"age":number,"occupation":string}},"suspects":[{"id":string,"name":string,"age":number,"occupation":string,"relationshipToVictim":string,"statement":string,"motive":string,"avatarPrompt":string}],"timeline":[{"time":string,"event":string}],"evidence":[{"id":string,"type":string,"title":string,"description":string,"timestamp":string,"relatedSuspects":[string],"content":object}],"solution":{"culpritId":string,"motive":string,"method":string,"explanation":string,"keyEvidenceIds":[string],"redHerrings":[string]}}. Requirements: exactly ${suspectCount} suspects with IDs S001 onward; one culprit who is a suspect; at least 3 unique evidence items with IDs E001 onward; at least 3 existing evidence IDs support the answer; dates and timeline agree; difficulty ${difficulty} controls clue subtlety; category ${category}; don't contradict established facts; keep chats, reports, and all case details fictional. User premise: ${scenario}`;
    const response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
    const data = caseShape.parse(JSON.parse(response.text));
    const suspectIds = data.suspects.map((s) => s.id);
    const evidenceIds = data.evidence.map((e) => e.id);
    if (suspectIds.length !== suspectCount || new Set(suspectIds).size !== suspectIds.length || !suspectIds.includes(data.solution.culpritId) || new Set(evidenceIds).size !== evidenceIds.length || data.solution.keyEvidenceIds.some((id) => !evidenceIds.includes(id)) || data.solution.keyEvidenceIds.length < 3) throw new Error('Generated case failed consistency checks. Please try generating again.');
    const saved = await Mystery.create(data);
    return res.status(201).json({ success: true, data: publicMystery(saved) });
  } catch (error) {
    console.error('Mystery generation failed:', error.message);
    return res.status(502).json({ success: false, message: error.message.includes('consistency checks') ? error.message : 'The case could not be generated or validated. Please try again.' });
  }
});

app.get('/api/v1/mysteries/:id', async (req, res) => {
  try {
    const mystery = await Mystery.findById(req.params.id);
    if (!mystery) return res.status(404).json({ success: false, message: 'Mystery not found.' });
    res.json({ success: true, data: publicMystery(mystery) });
  } catch { res.status(400).json({ success: false, message: 'Invalid mystery ID.' }); }
});

app.post('/api/v1/investigations', async (req, res) => {
  try {
    if (!(await Mystery.exists({ _id: req.body.mysteryId }))) return res.status(404).json({ success: false, message: 'Mystery not found.' });
    const investigation = await Investigation.create({ mysteryId: req.body.mysteryId });
    res.status(201).json({ success: true, data: { investigationId: investigation._id } });
  } catch { res.status(400).json({ success: false, message: 'Could not start investigation.' }); }
});

app.get('/api/v1/investigations/:id', async (req, res) => {
  try {
    const investigation = await Investigation.findById(req.params.id);
    if (!investigation) return res.status(404).json({ success: false, message: 'Investigation not found.' });
    res.json({ success: true, data: investigation });
  } catch { res.status(400).json({ success: false, message: 'Invalid investigation ID.' }); }
});

app.patch('/api/v1/investigations/:id/progress', async (req, res) => {
  try {
    const { openedEvidenceIds = [], bookmarkedEvidenceIds = [], investigationNotes = '' } = req.body;
    if (!Array.isArray(openedEvidenceIds) || !Array.isArray(bookmarkedEvidenceIds) || typeof investigationNotes !== 'string' || investigationNotes.length > 5000) return res.status(400).json({ success: false, message: 'Invalid progress update.' });
    const investigation = await Investigation.findByIdAndUpdate(req.params.id, { openedEvidenceIds, bookmarkedEvidenceIds, investigationNotes }, { new: true, runValidators: true });
    if (!investigation) return res.status(404).json({ success: false, message: 'Investigation not found.' });
    res.json({ success: true, data: investigation });
  } catch { res.status(400).json({ success: false, message: 'Could not save investigation progress.' }); }
});

app.post('/api/v1/investigations/:id/verdict', async (req, res) => {
  try {
    const investigation = await Investigation.findById(req.params.id);
    if (!investigation) return res.status(404).json({ success: false, message: 'Investigation not found.' });
    if (investigation.isCompleted) return res.status(409).json({ success: false, message: 'A verdict has already been submitted.' });
    const mystery = await Mystery.findById(investigation.mysteryId).select('+solution');
    const selected = mystery.suspects.find((s) => s.id === req.body.selectedSuspectId);
    if (!selected) return res.status(400).json({ success: false, message: 'Choose a valid suspect.' });
    const correct = selected.id === mystery.solution.culpritId;
    const exploredPoints = Math.round(Math.min(investigation.openedEvidenceIds.length, mystery.evidence.length) / mystery.evidence.length * 20);
    const score = (correct ? 70 : 0) + exploredPoints;
    investigation.selectedSuspectId = selected.id;
    investigation.isCompleted = true;
    investigation.submittedAt = new Date();
    investigation.score = score;
    await investigation.save();
    res.json({ success: true, data: { correct, score, actualCulprit: mystery.suspects.find((s) => s.id === mystery.solution.culpritId), explanation: mystery.solution.explanation, motive: mystery.solution.motive, method: mystery.solution.method, keyEvidence: mystery.solution.keyEvidenceIds.map((id) => mystery.evidence.find((e) => e.id === id)).filter(Boolean) } });
  } catch { res.status(400).json({ success: false, message: 'Could not submit verdict.' }); }
});

app.listen(port, () => console.log(`AL Mystery Room API listening on http://localhost:${port}`));
if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('your_')) mongoose.connect(process.env.MONGODB_URI).then(() => console.log('MongoDB connected')).catch((err) => console.error('MongoDB connection failed:', err.message));
