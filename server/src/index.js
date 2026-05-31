import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDb } from './db.js';
import {
  loadQuestions,
  loadMetadata,
  loadProgress,
  saveProgress,
  saveProgressItem,
  resetProgress,
  normalizeProgressPatch,
  emptyProgressItem,
  mergeQuestionProgress
} from './store.js';
import { applyQuestionFilters, sortQuestions, paginate, toCsv } from './query.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

const questions = await loadQuestions();
const metadata = await loadMetadata();

function withProgress(progressItems) {
  return questions.map((question) => mergeQuestionProgress(question, progressItems));
}

function buildStats(rows) {
  const statusCounts = { not_started: 0, in_progress: 0, solved: 0, revision: 0, skipped: 0 };
  const difficulty = {};
  const companyMap = new Map();
  const topicMap = new Map();
  const today = new Date().toISOString().slice(0, 10);
  let favorites = 0;
  let dueForReview = 0;

  for (const q of rows) {
    const progress = q.progress || emptyProgressItem();
    const status = progress.status || 'not_started';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    if (progress.favorite) favorites += 1;
    if (progress.nextReviewAt && progress.nextReviewAt <= today && status !== 'solved') dueForReview += 1;

    const d = q.difficulty || 'UNKNOWN';
    difficulty[d] ||= { total: 0, solved: 0, inProgress: 0, revision: 0 };
    difficulty[d].total += 1;
    if (status === 'solved') difficulty[d].solved += 1;
    if (status === 'in_progress') difficulty[d].inProgress += 1;
    if (status === 'revision') difficulty[d].revision += 1;

    for (const company of q.companies || []) {
      const item = companyMap.get(company) || { name: company, total: 0, solved: 0, inProgress: 0, revision: 0 };
      item.total += 1;
      if (status === 'solved') item.solved += 1;
      if (status === 'in_progress') item.inProgress += 1;
      if (status === 'revision') item.revision += 1;
      companyMap.set(company, item);
    }

    for (const topic of q.topics || []) {
      const item = topicMap.get(topic) || { name: topic, total: 0, solved: 0, inProgress: 0, revision: 0 };
      item.total += 1;
      if (status === 'solved') item.solved += 1;
      if (status === 'in_progress') item.inProgress += 1;
      if (status === 'revision') item.revision += 1;
      topicMap.set(topic, item);
    }
  }

  const total = rows.length;
  const solved = statusCounts.solved || 0;
  const completionPercent = total ? Math.round((solved / total) * 1000) / 10 : 0;
  const addPercent = (item) => ({ ...item, completionPercent: item.total ? Math.round((item.solved / item.total) * 1000) / 10 : 0 });

  return {
    total,
    solved,
    completionPercent,
    favorites,
    dueForReview,
    statusCounts,
    difficulty,
    companies: [...companyMap.values()].map(addPercent).sort((a, b) => b.total - a.total),
    topics: [...topicMap.values()].map(addPercent).sort((a, b) => b.total - a.total)
  };
}

app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, questions: questions.length, timestamp: new Date().toISOString() });
});

app.get('/api/meta', async (_req, res) => {
  const companies = new Set();
  const topics = new Set();
  const difficulties = new Set();
  const timeWindows = new Set();
  for (const q of questions) {
    if (q.difficulty) difficulties.add(q.difficulty);
    for (const c of q.companies || []) companies.add(c);
    for (const t of q.topics || []) topics.add(t);
    for (const w of q.timeWindows || []) timeWindows.add(w);
  }
  res.json({
    ...metadata,
    filterOptions: {
      difficulties: [...difficulties].sort((a, b) => ({ EASY: 1, MEDIUM: 2, HARD: 3 }[a] || 99) - ({ EASY: 1, MEDIUM: 2, HARD: 3 }[b] || 99)),
      companies: [...companies].sort((a, b) => a.localeCompare(b)),
      topics: [...topics].sort((a, b) => a.localeCompare(b)),
      timeWindows: [...timeWindows]
    }
  });
});

app.get('/api/questions', async (req, res) => {
  const progress = await loadProgress();
  const merged = withProgress(progress.items);
  const filtered = applyQuestionFilters(merged, req.query);
  const sorted = sortQuestions(filtered, req.query.sort || 'title', req.query.direction || 'asc');
  const { rows, pagination } = paginate(sorted, req.query.page, req.query.limit);
  res.json({ items: rows, pagination, stats: buildStats(filtered) });
});

app.get('/api/questions/:id', async (req, res) => {
  const progress = await loadProgress();
  const question = questions.find((q) => q.id === Number(req.params.id));
  if (!question) return res.status(404).json({ error: 'Question not found' });
  res.json(mergeQuestionProgress(question, progress.items));
});

app.get('/api/stats', async (req, res) => {
  const progress = await loadProgress();
  const merged = withProgress(progress.items);
  const filtered = applyQuestionFilters(merged, req.query);
  res.json(buildStats(filtered));
});

app.get('/api/progress', async (_req, res) => {
  const progress = await loadProgress();
  res.json(progress);
});

app.put('/api/progress/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!questions.some((q) => q.id === id)) return res.status(404).json({ error: 'Question not found' });
  const progress = await loadProgress();
  const existing = progress.items[String(id)] || emptyProgressItem();
  const patch = normalizeProgressPatch(req.body);
  const next = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await saveProgressItem(id, next);
  res.json({ id, progress: next });
});

app.post('/api/progress/bulk', async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
  const patch = normalizeProgressPatch(req.body.patch || {});
  const validIds = new Set(questions.map((q) => q.id));
  const progress = await loadProgress();
  const batchItems = {};
  for (const id of ids) {
    if (!validIds.has(id)) continue;
    const existing = progress.items[String(id)] || emptyProgressItem();
    batchItems[String(id)] = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  }
  await saveProgress({ items: batchItems });
  res.json({ updated: Object.keys(batchItems).length });
});

app.post('/api/progress/reset', async (_req, res) => {
  const progress = await resetProgress();
  res.json(progress);
});

app.get('/api/export/progress.csv', async (req, res) => {
  const progress = await loadProgress();
  const merged = withProgress(progress.items);
  const filtered = applyQuestionFilters(merged, req.query);
  const csv = toCsv(sortQuestions(filtered, req.query.sort || 'title', req.query.direction || 'asc'));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="dsa-progress-export.csv"');
  res.send(csv);
});

app.get('/api/export/progress.json', async (_req, res) => {
  const progress = await loadProgress();
  res.setHeader('Content-Disposition', 'attachment; filename="dsa-progress-backup.json"');
  res.json(progress);
});

app.post('/api/import/progress', async (req, res) => {
  if (!req.body || !req.body.items || typeof req.body.items !== 'object') {
    return res.status(400).json({ error: 'Expected a JSON backup with an items object.' });
  }
  const validIds = new Set(questions.map((q) => String(q.id)));
  const imported = { version: 1, updatedAt: new Date().toISOString(), items: {} };
  for (const [id, item] of Object.entries(req.body.items)) {
    if (!validIds.has(String(id))) continue;
    imported.items[String(id)] = { ...emptyProgressItem(), ...normalizeProgressPatch(item), updatedAt: item.updatedAt || new Date().toISOString() };
  }
  await saveProgress(imported);
  res.json({ imported: Object.keys(imported.items).length });
});

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  try {
    await connectDb();
    app.listen(port, () => {
      console.log(`DSA tracker backend running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
}


startServer();

