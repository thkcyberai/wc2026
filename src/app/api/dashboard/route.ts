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
    const meta = getMeta();
    const last = meta.lastRefresh as { ran_at: string } | null;
    return NextResponse.json({
      ...getDashboard(),
      meta: {
        prettyToday: meta.prettyToday,
        lastRefresh: last ? { ran_at: last.ran_at } : null,
      },
    });
  } catch (err) {
    console.error('[api/dashboard]', err);
    return NextResponse.json({ error: 'Failed to load dashboard data.' }, { status: 500 });
  }
}
