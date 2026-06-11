import { NextResponse } from 'next/server';
import { getGroups } from '@/lib/queries';
import { isSeeded } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!isSeeded()) {
      return NextResponse.json({ error: 'Database not seeded. Run: npm run seed' }, { status: 503 });
    }
    return NextResponse.json({ groups: getGroups() });
  } catch (err) {
    console.error('[api/groups]', err);
    return NextResponse.json({ error: 'Failed to load groups.' }, { status: 500 });
  }
}
