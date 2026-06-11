import { NextRequest, NextResponse } from 'next/server';
import { getAllMatches } from '@/lib/queries';
import { isSeeded } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!isSeeded()) {
      return NextResponse.json({ error: 'Database not seeded. Run: npm run seed' }, { status: 503 });
    }
    const p = req.nextUrl.searchParams;
    const team = p.get('team')?.toLowerCase() ?? '';
    const group = p.get('group') ?? '';
    const venue = p.get('venue') ?? '';
    const stage = p.get('stage') ?? '';
    const date = p.get('date') ?? '';
    const country = p.get('country') ?? '';
    const q = p.get('q')?.toLowerCase() ?? '';

    let matches = getAllMatches();
    if (team) {
      matches = matches.filter(
        (m) =>
          m.home_team?.name.toLowerCase().includes(team) ||
          m.away_team?.name.toLowerCase().includes(team) ||
          m.home_team?.code.toLowerCase() === team ||
          m.away_team?.code.toLowerCase() === team
      );
    }
    if (group) matches = matches.filter((m) => m.group_letter === group);
    if (venue) matches = matches.filter((m) => m.venue.key === venue);
    if (stage) matches = matches.filter((m) => m.stage === stage);
    if (date) matches = matches.filter((m) => m.date_venue === date);
    if (country) matches = matches.filter((m) => m.venue.country === country);
    if (q) {
      matches = matches.filter((m) =>
        [
          m.home_team?.name, m.away_team?.name,
          m.home_placeholder, m.away_placeholder,
          m.venue.name, m.venue.city, m.stage_label, `match ${m.id}`,
        ]
          .filter(Boolean)
          .some((s) => (s as string).toLowerCase().includes(q))
      );
    }
    return NextResponse.json({ matches, total: matches.length });
  } catch (err) {
    console.error('[api/matches]', err);
    return NextResponse.json({ error: 'Failed to load matches.' }, { status: 500 });
  }
}
