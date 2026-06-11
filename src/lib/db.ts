import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { SCHEMA_SQL } from './schema';

const DB_PATH =
  process.env.WC2026_DB_PATH || path.join(process.cwd(), 'data', 'wc2026.db');

// Cache across Next.js dev hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __wc2026db: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (global.__wc2026db) return global.__wc2026db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA_SQL);
  global.__wc2026db = db;

  // Auto-seed on first boot (fresh volume in production). Never reseeds an
  // existing DB, so refreshed scores are preserved across deploys.
  const row = db.prepare('SELECT COUNT(*) AS n FROM matches').get() as { n: number };
  if (row.n === 0) {
    // require lazily to avoid pulling seed data into every cold path
    const { seedDatabase } = require('./seed') as typeof import('./seed');
    seedDatabase(db);
    console.log('[db] empty database detected — seeded full WC2026 structure');
  }
  return db;
}

export function isSeeded(): boolean {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) AS n FROM matches').get() as { n: number };
  return row.n === 104;
}
