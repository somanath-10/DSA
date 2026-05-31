import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
const questionsPath = path.join(dataDir, 'questions.json');
const metadataPath = path.join(dataDir, 'metadata.json');
const progressPath = path.join(dataDir, 'progress.json');

const defaultProgress = () => ({
  version: 1,
  updatedAt: new Date().toISOString(),
  items: {}
});

export async function loadQuestions() {
  const raw = await fs.readFile(questionsPath, 'utf8');
  return JSON.parse(raw);
}

export async function loadMetadata() {
  const raw = await fs.readFile(metadataPath, 'utf8');
  return JSON.parse(raw);
}

export async function ensureProgressFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(progressPath);
  } catch {
    await saveProgress(defaultProgress());
  }
}

export async function loadProgress() {
  await ensureProgressFile();
  const raw = await fs.readFile(progressPath, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.items || typeof parsed.items !== 'object') return defaultProgress();
    return parsed;
  } catch {
    return defaultProgress();
  }
}

export async function saveProgress(progress) {
  progress.updatedAt = new Date().toISOString();
  const tempPath = `${progressPath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(progress, null, 2), 'utf8');
  await fs.rename(tempPath, progressPath);
  return progress;
}

export async function resetProgress() {
  const progress = defaultProgress();
  await saveProgress(progress);
  return progress;
}

export function normalizeProgressPatch(body = {}) {
  const allowedStatuses = new Set(['not_started', 'in_progress', 'solved', 'revision', 'skipped']);
  const allowedPriorities = new Set(['low', 'medium', 'high']);
  const patch = {};

  if (body.status !== undefined) {
    patch.status = allowedStatuses.has(body.status) ? body.status : 'not_started';
  }
  if (body.favorite !== undefined) patch.favorite = Boolean(body.favorite);
  if (body.priority !== undefined) patch.priority = allowedPriorities.has(body.priority) ? body.priority : 'medium';
  if (body.notes !== undefined) patch.notes = String(body.notes || '').slice(0, 5000);
  if (body.lastReviewedAt !== undefined) patch.lastReviewedAt = String(body.lastReviewedAt || '');
  if (body.nextReviewAt !== undefined) patch.nextReviewAt = String(body.nextReviewAt || '');
  if (body.tags !== undefined) {
    const tags = Array.isArray(body.tags) ? body.tags : String(body.tags).split(',');
    patch.tags = [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 20);
  }
  return patch;
}

export function emptyProgressItem() {
  return {
    status: 'not_started',
    favorite: false,
    priority: 'medium',
    notes: '',
    tags: [],
    lastReviewedAt: '',
    nextReviewAt: '',
    updatedAt: ''
  };
}

export function mergeQuestionProgress(question, progressItems) {
  const item = progressItems[String(question.id)] || emptyProgressItem();
  return { ...question, progress: { ...emptyProgressItem(), ...item } };
}
