import { NextRequest, NextResponse } from 'next/server';
import { getAllMatches } from '@/lib/queries';
import { isSeeded } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!isSeeded()) {
      return NextResponse.json({ error: 'Database not seeded. Run: npm run seed' }, { status: 503 });
    }
    // sanitize: cap lengths and whitelist where possible (defense in depth —
    // these values are only used in in-memory filters, never in SQL)
    const p = req.nextUrl.searchParams;
    const cap = (v: string | null, n = 60) => (v ?? '').slice(0, n);
    const team = cap(p.get('team')).toLowerCase();
    const group = /^[A-L]$/.test(cap(p.get('group'), 1)) ? cap(p.get('group'), 1) : '';
    const venue = cap(p.get('venue'), 10);
    const stage = ['GROUP', 'R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL'].includes(cap(p.get('stage'), 10))
      ? cap(p.get('stage'), 10) : '';
    const date = /^\d{4}-\d{2}-\d{2}$/.test(cap(p.get('date'), 10)) ? cap(p.get('date'), 10) : '';
    const country = ['USA', 'Canada', 'Mexico'].includes(cap(p.get('country'), 10)) ? cap(p.get('country'), 10) : '';
    const q = cap(p.get('q'), 100).toLowerCase();

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
