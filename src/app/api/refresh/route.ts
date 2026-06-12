import { NextResponse } from 'next/server';
import { getDb, isSeeded } from '@/lib/db';
import { runRefresh } from '@/lib/refresh';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Public-internet guard: at most one refresh per minute, shared across callers.
let lastRefreshAt = 0;
const COOLDOWN_MS = 60_000;

export async function POST() {
  try {
    const now = Date.now();
    if (now - lastRefreshAt < COOLDOWN_MS) {
      return NextResponse.json(
        { error: `Please wait ${Math.ceil((COOLDOWN_MS - (now - lastRefreshAt)) / 1000)}s — data was just refreshed.` },
        { status: 429 }
      );
    }
    lastRefreshAt = now;
    if (!isSeeded()) {
      return NextResponse.json({ error: 'Database not seeded. Run: npm run seed' }, { status: 503 });
    }
    const result = await runRefresh(getDb());
    // full details (providers, errors, quotas) go to server logs only
    console.log('[refresh]', result.message);
    return NextResponse.json({
      ok: result.ok,
      matchesUpdated: result.matchesUpdated,
      ranAt: result.ranAt,
      message: result.ok
        ? `Updated ${result.matchesUpdated} match${result.matchesUpdated === 1 ? '' : 'es'}. Standings & bracket recalculated.`
        : 'Could not fetch new data right now — showing the latest saved results. Try again later.',
    });
  } catch (err) {
    console.error('[api/refresh]', err);
    return NextResponse.json(
      { error: 'Refresh failed unexpectedly. Check the server console.' },
      { status: 500 }
    );
  }
}
