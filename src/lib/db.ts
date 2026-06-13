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
 * In production (AUTO_REFRESH=true), refresh scores automatically.
 * Adaptive cadence:
 *   - LIVE window (a match is live, or kicks off within 15 min, or kicked off
 *     less than 3h ago): refresh every LIVE_REFRESH_MINUTES (default 3).
 *   - otherwise: every AUTO_REFRESH_HOURS (default 6).
 * Started lazily on first DB access, guarded to run once per process.
 */
function maybeStartAutoRefresh(db: Database.Database) {
  if (global.__wc2026AutoRefresh) return;
  if (process.env.AUTO_REFRESH !== 'true') return;
  global.__wc2026AutoRefresh = true;

  const slowMs = Number(process.env.AUTO_REFRESH_HOURS || '6') * 3_600_000;
  const fastMs = Math.max(2, Number(process.env.LIVE_REFRESH_MINUTES || '3')) * 60_000;

  const inLiveWindow = (): boolean => {
    try {
      const rows = db.prepare(
        "SELECT status, kickoff_utc FROM matches WHERE status != 'finished'"
      ).all() as { status: string; kickoff_utc: string }[];
      const now = Date.now();
      return rows.some((m) => {
        if (m.status === 'live') return true;
        const ko = Date.parse(m.kickoff_utc);
        return ko - 15 * 60_000 <= now && now <= ko + 3 * 3_600_000;
      });
    } catch {
      return false;
    }
  };

  let lastRun = 0;
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    lastRun = Date.now();
    try {
      const { runRefresh } = await import('./refresh');
      const result = await runRefresh(db);
      console.log(`[auto-refresh] ${result.ok ? 'ok' : 'failed'} — ${result.message}`);
    } catch (err) {
      console.error('[auto-refresh] error:', err);
    } finally {
      running = false;
    }
  };

  // check once a minute whether a refresh is due at the current cadence
  setInterval(() => {
    const due = inLiveWindow() ? fastMs : slowMs;
    if (Date.now() - lastRun >= due) void tick();
  }, 60_000);
  setTimeout(tick, 30_000);
  console.log(
    `[auto-refresh] enabled — every ${slowMs / 3_600_000}h, ` +
    `every ${fastMs / 60_000}min during live windows`
  );
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
