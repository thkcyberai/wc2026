import { NextResponse } from 'next/server';
import { getDb, isSeeded } from '@/lib/db';
import { loadSquads } from '@/lib/players';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// Guard: loading 48 squads costs ~49 API calls — once per 10 minutes max.
let lastLoadAt = 0;

export async function POST() {
  try {
    if (!isSeeded()) {
      return NextResponse.json({ error: 'Database not seeded. Run: npm run seed' }, { status: 503 });
    }
    const now = Date.now();
    if (now - lastLoadAt < 10 * 60_000) {
      return NextResponse.json(
        { error: 'Squads were loaded recently — try again in a few minutes (API quota protection).' },
        { status: 429 }
      );
    }
    lastLoadAt = now;
    const result = await loadSquads(getDb());
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (err) {
    console.error('[api/players/load]', err);
    return NextResponse.json({ error: 'Squad load failed unexpectedly.' }, { status: 500 });
  }
}
