import { NextResponse } from 'next/server';
import { getMeta, getRefreshLogs } from '@/lib/queries';
import { isSeeded } from '@/lib/db';
import { openAiAvailable } from '@/lib/openaiClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!isSeeded()) {
      return NextResponse.json({ error: 'Database not seeded. Run: npm run seed' }, { status: 503 });
    }
    return NextResponse.json({
      ...getMeta(),
      logs: getRefreshLogs(20),
      openAiConfigured: openAiAvailable(),
      footballDataConfigured: Boolean(process.env.FOOTBALL_DATA_API_KEY),
    });
  } catch (err) {
    console.error('[api/meta]', err);
    return NextResponse.json({ error: 'Failed to load settings data.' }, { status: 500 });
  }
}
