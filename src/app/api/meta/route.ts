import { NextResponse } from 'next/server';
import { getMeta, getRefreshLogs } from '@/lib/queries';
import { isSeeded } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface LogRow {
  id: number; ran_at: string; source: string; ok: number;
  matches_updated: number; message: string;
}

// Public endpoint — expose only non-sensitive operational facts.
// Full diagnostics (provider errors, quota messages, config status) stay in
// the server logs.
export async function GET() {
  try {
    if (!isSeeded()) {
      return NextResponse.json({ error: 'Service is initializing.' }, { status: 503 });
    }
    const meta = getMeta();
    const lastRefresh = meta.lastRefresh as LogRow | null;
    const logs = (getRefreshLogs(20) as LogRow[]).map((l) => ({
      id: l.id,
      ran_at: l.ran_at,
      ok: l.ok,
      matches_updated: l.matches_updated,
    }));
    return NextResponse.json({
      teams: meta.teams,
      matches: meta.matches,
      finished: meta.finished,
      prettyToday: meta.prettyToday,
      lastRefresh: lastRefresh
        ? { ran_at: lastRefresh.ran_at, ok: lastRefresh.ok, matches_updated: lastRefresh.matches_updated }
        : null,
      logs,
    });
  } catch (err) {
    console.error('[api/meta]', err);
    return NextResponse.json({ error: 'Failed to load data.' }, { status: 500 });
  }
}
