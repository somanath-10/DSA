import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'dsa_tracker';

if (!uri) {
  throw new Error('MONGODB_URI is not set in environment variables.');
}

let client;
let db;

export async function connectDb() {
  if (db) return db;
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  db = client.db(dbName);
  console.log(`Connected to MongoDB: ${dbName}`);
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not connected. Call connectDb() first.');
  return db;
}
