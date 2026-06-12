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
  // eslint-disable-next-line no-var
  var __wc2026AutoRefresh: boolean | undefined;
}

/**
 * In production (AUTO_REFRESH=true), refresh scores automatically on a
 * schedule. Started lazily on first DB access (every API route hits this),
 * guarded so it only ever starts once per process.
 */
function maybeStartAutoRefresh(db: Database.Database) {
  if (global.__wc2026AutoRefresh) return;
  if (process.env.AUTO_REFRESH !== 'true') return;
  global.__wc2026AutoRefresh = true;

  const hours = Number(process.env.AUTO_REFRESH_HOURS || '6');
  const tick = async () => {
    try {
      const { runRefresh } = await import('./refresh');
      const result = await runRefresh(db);
      console.log(`[auto-refresh] ${result.ok ? 'ok' : 'failed'} — ${result.message}`);
    } catch (err) {
      console.error('[auto-refresh] error:', err);
    }
  };
  setTimeout(tick, 30_000);
  setInterval(tick, hours * 60 * 60 * 1000);
  console.log(`[auto-refresh] enabled — every ${hours}h`);
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
  maybeStartAutoRefresh(db);
  return db;
}

export function isSeeded(): boolean {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) AS n FROM matches').get() as { n: number };
  return row.n === 104;
}
