import { NextResponse } from 'next/server';
import { getDb, isSeeded } from '@/lib/db';
import { getTopScorers } from '@/lib/players';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!isSeeded()) {
      return NextResponse.json({ error: 'Database not seeded. Run: npm run seed' }, { status: 503 });
    }
    return NextResponse.json(getTopScorers(getDb()));
  } catch (err) {
    console.error('[api/scorers]', err);
    return NextResponse.json({ error: 'Failed to load scorers.' }, { status: 500 });
  }
}
