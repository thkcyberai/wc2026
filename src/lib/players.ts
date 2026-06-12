// Squads, match events and top-scorer logic.
// Primary source: API-Football (squads + photos + events).
// Fallback for the goal ranking when API-Football is absent: football-data.org
// top scorers (names + goals, no photos).

import type Database from 'better-sqlite3';
import {
  apiFootballAvailable, fetchFixtureEvents, fetchFixtures, fetchSquad,
  fetchTournamentTeams, mapEventType, resetCallBudget,
} from './apiFootball';
import { mapTeamNames, openAiAvailable } from './openaiClient';

// Provider team names → our canonical names (extends the refresh alias map)
const NAME_ALIASES: Record<string, string> = {
  usa: 'United States', 'korea republic': 'South Korea', 'south korea': 'South Korea',
  'czech republic': 'Czechia', turkey: 'Türkiye', 'cote d\'ivoire': 'Ivory Coast',
  'côte d\'ivoire': 'Ivory Coast', 'ivory coast': 'Ivory Coast', iran: 'Iran',
  'cabo verde': 'Cape Verde', 'congo dr': 'DR Congo', 'dr congo': 'DR Congo',
  'bosnia-herzegovina': 'Bosnia and Herzegovina', bosnia: 'Bosnia and Herzegovina',
  curacao: 'Curaçao',
};

function teamResolver(db: Database.Database) {
  const teams = db.prepare('SELECT id, code, name FROM teams').all() as
    { id: number; code: string; name: string }[];
  const byName = new Map<string, number>();
  for (const t of teams) {
    byName.set(t.name.toLowerCase(), t.id);
    byName.set(t.code.toLowerCase(), t.id);
  }
  for (const [alias, canonical] of Object.entries(NAME_ALIASES)) {
    const id = byName.get(canonical.toLowerCase());
    if (id) byName.set(alias.toLowerCase(), id);
  }
  return {
    resolve: (n: string) => byName.get(n.trim().toLowerCase()) ?? null,
    canonical: teams.map((t) => t.name),
  };
}

export interface SquadLoadResult {
  ok: boolean;
  teamsLoaded: number;
  playersLoaded: number;
  message: string;
}

/**
 * Load all 48 squads (≈49 API calls). Skips teams that already have players,
 * so re-running tops up missing teams without burning the daily quota.
 */
export async function loadSquads(db: Database.Database): Promise<SquadLoadResult> {
  if (!apiFootballAvailable()) {
    return { ok: false, teamsLoaded: 0, playersLoaded: 0, message: 'API_FOOTBALL_KEY not configured — add it to enable squads and player photos.' };
  }
  resetCallBudget();
  const { resolve, canonical } = teamResolver(db);

  const afTeams = await fetchTournamentTeams();
  if (!afTeams.length) {
    return { ok: false, teamsLoaded: 0, playersLoaded: 0, message: 'API-Football returned no World Cup 2026 teams (squad data may not be published yet).' };
  }

  // resolve AF team names → our ids (OpenAI assist for any stragglers)
  const mapped = new Map<number, number>(); // af team id -> our team id
  const unknown: string[] = [];
  for (const t of afTeams) {
    const id = resolve(t.team.name) ?? (t.team.code ? resolve(t.team.code) : null);
    if (id) mapped.set(t.team.id, id);
    else unknown.push(t.team.name);
  }
  if (unknown.length && openAiAvailable()) {
    const m = await mapTeamNames(unknown, canonical);
    if (m) {
      for (const t of afTeams) {
        if (mapped.has(t.team.id)) continue;
        const c = m[t.team.name];
        const id = c ? resolve(c) : null;
        if (id) mapped.set(t.team.id, id);
      }
    }
  }

  const hasPlayers = db.prepare('SELECT COUNT(*) AS n FROM players WHERE team_id = ?');
  const insert = db.prepare(`
    INSERT INTO players (af_id, team_id, name, position, shirt_number, photo_url)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (af_id) DO UPDATE SET
      team_id=excluded.team_id, name=excluded.name, position=excluded.position,
      shirt_number=excluded.shirt_number, photo_url=excluded.photo_url
  `);

  let teamsLoaded = 0;
  let playersLoaded = 0;
  const errors: string[] = [];

  for (const [afId, ourId] of mapped) {
    const existing = (hasPlayers.get(ourId) as { n: number }).n;
    if (existing >= 20) continue; // already loaded
    try {
      const squads = await fetchSquad(afId);
      const players = squads[0]?.players ?? [];
      if (!players.length) continue;
      const tx = db.transaction(() => {
        for (const p of players) {
          insert.run(p.id, ourId, p.name, p.position ?? null, p.number ?? null, p.photo ?? null);
          playersLoaded++;
        }
      });
      tx();
      teamsLoaded++;
    } catch (e) {
      errors.push(`${afId}: ${(e as Error).message}`);
      if (/budget/i.test((e as Error).message)) break; // stop cleanly when out of quota
    }
  }

  const total = (db.prepare('SELECT COUNT(*) AS n FROM players').get() as { n: number }).n;
  return {
    ok: teamsLoaded > 0 || total > 0,
    teamsLoaded, playersLoaded,
    message: `Squads: ${teamsLoaded} teams updated, ${playersLoaded} players saved (${total} total in DB).`
      + (errors.length ? ` Issues: ${errors.slice(0, 3).join(' | ')}` : ''),
  };
}

/**
 * Sync goal/card events for finished matches that don't have them yet.
 * Uses one fixtures call to map AF fixture ids, then one call per match.
 */
export async function syncMatchEvents(db: Database.Database): Promise<string> {
  if (!apiFootballAvailable()) return 'events skipped (no API_FOOTBALL_KEY)';

  const { resolve } = teamResolver(db);

  // 1. ensure fixture mapping exists
  const unmappedFinished = db.prepare(`
    SELECT COUNT(*) AS n FROM matches m
    WHERE m.status='finished'
      AND m.id NOT IN (SELECT match_id FROM af_fixture_map)
  `).get() as { n: number };

  if (unmappedFinished.n > 0) {
    try {
      const fixtures = await fetchFixtures();
      const byTeams = db.prepare(`
        SELECT id FROM matches
        WHERE (home_team_id = @h AND away_team_id = @a) OR (home_team_id = @a AND away_team_id = @h)
      `);
      const ins = db.prepare(
        'INSERT OR IGNORE INTO af_fixture_map (match_id, af_fixture_id) VALUES (?, ?)'
      );
      const tx = db.transaction(() => {
        for (const f of fixtures) {
          const h = resolve(f.teams.home.name);
          const a = resolve(f.teams.away.name);
          if (!h || !a) continue;
          const row = byTeams.get({ h, a }) as { id: number } | undefined;
          if (row) ins.run(row.id, f.fixture.id);
        }
      });
      tx();
    } catch (e) {
      return `events: fixture mapping failed (${(e as Error).message})`;
    }
  }

  // 2. fetch events for finished matches not yet synced
  const pending = db.prepare(`
    SELECT fm.match_id, fm.af_fixture_id FROM af_fixture_map fm
    JOIN matches m ON m.id = fm.match_id
    WHERE m.status='finished' AND fm.events_synced = 0
    ORDER BY m.kickoff_utc
    LIMIT 30
  `).all() as { match_id: number; af_fixture_id: number }[];

  if (!pending.length) return 'events: up to date';

  const playerByAf = db.prepare('SELECT id FROM players WHERE af_id = ?');
  const playerByName = db.prepare('SELECT id FROM players WHERE team_id = ? AND name = ?');
  const del = db.prepare('DELETE FROM match_events WHERE match_id = ?');
  const ins = db.prepare(`
    INSERT INTO match_events (match_id, team_id, player_id, player_name, type, minute, minute_extra)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const markSynced = db.prepare('UPDATE af_fixture_map SET events_synced = 1 WHERE match_id = ?');

  let synced = 0;
  const errors: string[] = [];
  for (const p of pending) {
    try {
      const events = await fetchFixtureEvents(p.af_fixture_id);
      const tx = db.transaction(() => {
        del.run(p.match_id);
        for (const ev of events) {
          const type = mapEventType(ev);
          if (!type || !ev.player?.name) continue;
          const teamId = resolve(ev.team.name);
          let playerId: number | null = null;
          if (ev.player.id) {
            playerId = (playerByAf.get(ev.player.id) as { id: number } | undefined)?.id ?? null;
          }
          if (!playerId && teamId) {
            playerId = (playerByName.get(teamId, ev.player.name) as { id: number } | undefined)?.id ?? null;
          }
          ins.run(p.match_id, teamId, playerId, ev.player.name, type, ev.time.elapsed, ev.time.extra);
        }
        markSynced.run(p.match_id);
      });
      tx();
      synced++;
    } catch (e) {
      errors.push((e as Error).message);
      if (/budget/i.test((e as Error).message)) break;
    }
  }
  return `events: synced ${synced}/${pending.length} matches` + (errors.length ? ` (${errors[0]})` : '');
}

/** Update the football-data.org top-scorer fallback table. */
export async function syncFdScorers(db: Database.Database): Promise<void> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) return;
  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/2000/scorers?limit=50', {
      headers: { 'X-Auth-Token': key },
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      scorers?: { player?: { name?: string }; team?: { name?: string }; goals?: number }[];
    };
    if (!Array.isArray(data.scorers)) return;
    const { resolve } = teamResolver(db);
    const ins = db.prepare(`
      INSERT INTO fd_scorers (player_name, team_id, goals) VALUES (?, ?, ?)
      ON CONFLICT (player_name) DO UPDATE SET team_id=excluded.team_id, goals=excluded.goals
    `);
    const tx = db.transaction(() => {
      for (const s of data.scorers!) {
        if (!s.player?.name || typeof s.goals !== 'number' || s.goals < 1) continue;
        ins.run(s.player.name, s.team?.name ? resolve(s.team.name) : null, s.goals);
      }
    });
    tx();
  } catch {
    // fallback source only — never fail the refresh over it
  }
}

export interface ScorerRow {
  rank: number;
  player_name: string;
  photo_url: string | null;
  team_name: string | null;
  team_code: string | null;
  goals: number;
}

/** Goal ranking (goals ≥ 1, descending). Events are primary, fd_scorers fallback. */
export function getTopScorers(db: Database.Database): { source: string; scorers: ScorerRow[] } {
  const fromEvents = db.prepare(`
    SELECT e.player_name, e.player_id, e.team_id, COUNT(*) AS goals
    FROM match_events e
    WHERE e.type IN ('goal','penalty')
    GROUP BY COALESCE(CAST(e.player_id AS TEXT), e.player_name || '-' || COALESCE(e.team_id,''))
    HAVING goals >= 1
    ORDER BY goals DESC, e.player_name ASC
  `).all() as { player_name: string; player_id: number | null; team_id: number | null; goals: number }[];

  const teamById = db.prepare('SELECT name, code FROM teams WHERE id = ?');
  const playerById = db.prepare('SELECT photo_url FROM players WHERE id = ?');
  const playerByName = db.prepare('SELECT photo_url FROM players WHERE name = ? LIMIT 1');

  const decorate = (rows: { player_name: string; player_id?: number | null; team_id: number | null; goals: number }[]): ScorerRow[] =>
    rows.map((r, i) => {
      const team = r.team_id ? (teamById.get(r.team_id) as { name: string; code: string } | undefined) : undefined;
      let photo: string | null = null;
      if (r.player_id) photo = (playerById.get(r.player_id) as { photo_url: string | null } | undefined)?.photo_url ?? null;
      if (!photo) photo = (playerByName.get(r.player_name) as { photo_url: string | null } | undefined)?.photo_url ?? null;
      return {
        rank: i + 1,
        player_name: r.player_name,
        photo_url: photo,
        team_name: team?.name ?? null,
        team_code: team?.code ?? null,
        goals: r.goals,
      };
    });

  if (fromEvents.length) return { source: 'match events (API-Football)', scorers: decorate(fromEvents) };

  const fallback = db.prepare(`
    SELECT player_name, team_id, goals FROM fd_scorers
    WHERE goals >= 1 ORDER BY goals DESC, player_name ASC
  `).all() as { player_name: string; team_id: number | null; goals: number }[];
  return { source: 'football-data.org top scorers', scorers: decorate(fallback) };
}
