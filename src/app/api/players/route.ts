import { NextRequest, NextResponse } from 'next/server';
import { getDb, isSeeded } from '@/lib/db';
import { apiFootballAvailable } from '@/lib/apiFootball';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!isSeeded()) {
      return NextResponse.json({ error: 'Database not seeded. Run: npm run seed' }, { status: 503 });
    }
    const db = getDb();
    // FIFA trigrams only — anything else is treated as "no team selected"
    const raw = req.nextUrl.searchParams.get('team') ?? '';
    const teamCode = /^[A-Z]{3}$/.test(raw) ? raw : null;

    const teams = db.prepare(`
      SELECT t.id, t.code, t.name, t.group_letter,
        (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id) AS player_count
      FROM teams t ORDER BY t.name
    `).all();

    let players: unknown[] = [];
    if (teamCode) {
      players = db.prepare(`
        SELECT p.* FROM players p
        JOIN teams t ON t.id = p.team_id
        WHERE t.code = ?
        ORDER BY CASE p.position
            WHEN 'Goalkeeper' THEN 0 WHEN 'Defender' THEN 1
            WHEN 'Midfielder' THEN 2 WHEN 'Attacker' THEN 3 ELSE 4 END,
          COALESCE(p.shirt_number, 99)
      `).all(teamCode);
    }

    const total = (db.prepare('SELECT COUNT(*) AS n FROM players').get() as { n: number }).n;
    return NextResponse.json({
      teams, players, totalPlayers: total,
      apiFootballConfigured: apiFootballAvailable(),
    });
  } catch (err) {
    console.error('[api/players]', err);
    return NextResponse.json({ error: 'Failed to load players.' }, { status: 500 });
  }
}
