import { NextResponse } from 'next/server';
import { getDashboard, getMeta } from '@/lib/queries';
import { isSeeded } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!isSeeded()) {
      return NextResponse.json(
        { error: 'Database not seeded. Run: npm run seed' },
        { status: 503 }
      );
    }
    return NextResponse.json({ ...getDashboard(), meta: getMeta() });
  } catch (err) {
    console.error('[api/dashboard]', err);
    return NextResponse.json({ error: 'Failed to load dashboard data.' }, { status: 500 });
  }
}
