import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
const questionsPath = path.join(dataDir, 'questions.json');
const metadataPath = path.join(dataDir, 'metadata.json');

// ─── Static data (files, read-only) ─────────────────────────────────────────

export async function loadQuestions() {
  const raw = await fs.readFile(questionsPath, 'utf8');
  return JSON.parse(raw);
}

export async function loadMetadata() {
  const raw = await fs.readFile(metadataPath, 'utf8');
  return JSON.parse(raw);
}

// ─── Progress helpers ────────────────────────────────────────────────────────

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

export function mergeQuestionProgress(question, progressItems) {
  const item = progressItems[String(question.id)] || emptyProgressItem();
  return { ...question, progress: { ...emptyProgressItem(), ...item } };
}

// ─── MongoDB progress CRUD ───────────────────────────────────────────────────

function collection() {
  return getDb().collection('progress');
}

/**
 * Load all progress documents from MongoDB.
 * Returns the same shape the app expects: { version, updatedAt, items: { "id": {...} } }
 */
export async function loadProgress() {
  const docs = await collection().find({}).toArray();
  const items = {};
  for (const doc of docs) {
    const { _id, ...fields } = doc;
    items[String(_id)] = fields;
  }
  return { version: 1, updatedAt: new Date().toISOString(), items };
}

/**
 * Save a single question's progress item to MongoDB (upsert by questionId).
 */
export async function saveProgressItem(questionId, item) {
  const { _id, ...fields } = item;
  await collection().updateOne(
    { _id: String(questionId) },
    { $set: fields },
    { upsert: true }
  );
}

/**
 * Save an entire progress object { items: { id: {...} } } by upserting all items.
 * Used by import and reset flows.
 */
export async function saveProgress(progress) {
  const col = collection();
  const entries = Object.entries(progress.items || {});
  if (entries.length > 0) {
    const ops = entries.map(([id, item]) => ({
      updateOne: {
        filter: { _id: String(id) },
        update: { $set: { ...item } },
        upsert: true
      }
    }));
    await col.bulkWrite(ops, { ordered: false });
  }
  return progress;
}

/**
 * Delete all progress documents — full reset.
 */
export async function resetProgress() {
  await collection().deleteMany({});
  return { version: 1, updatedAt: new Date().toISOString(), items: {} };
}
