import { NextResponse } from 'next/server';
import { getKnockout } from '@/lib/queries';
import { isSeeded } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!isSeeded()) {
      return NextResponse.json({ error: 'Database not seeded. Run: npm run seed' }, { status: 503 });
    }
    return NextResponse.json(getKnockout());
  } catch (err) {
    console.error('[api/knockout]', err);
    return NextResponse.json({ error: 'Failed to load knockout bracket.' }, { status: 500 });
  }
}
