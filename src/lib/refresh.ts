// Refresh pipeline: fetch official fixture/score data from public sources,
// validate, (optionally) normalize via OpenAI, store in SQLite, then
// recalculate standings and knockout placeholders.
//
// Sources (in order):
//   1. football-data.org v4 (FIFA World Cup, competition 2000) — needs free API key
//   2. openfootball public JSON dataset (best-effort fallback, no key needed)
// OpenAI is ONLY used to normalize/map data and explain errors — never as a
// score source.

import type Database from 'better-sqlite3';
import { recalculateStandings } from './standings';
import { resolveKnockout } from './knockout';
import { explainError, mapTeamNames, openAiAvailable } from './openaiClient';
import type { RefreshResult } from './types';

interface SourceFixture {
  matchNumber: number | null;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  homePens: number | null;
  awayPens: number | null;
  status: 'scheduled' | 'live' | 'finished';
}

// Common alternative spellings used by data providers → our canonical names
const TEAM_ALIASES: Record<string, string> = {
  'korea republic': 'South Korea', 'korea, south': 'South Korea', 'south korea': 'South Korea',
  'czech republic': 'Czechia', czechia: 'Czechia',
  usa: 'United States', 'united states of america': 'United States', 'united states': 'United States',
  turkey: 'Türkiye', turkiye: 'Türkiye', 'türkiye': 'Türkiye',
  "cote d'ivoire": 'Ivory Coast', "côte d'ivoire": 'Ivory Coast', 'ivory coast': 'Ivory Coast',
  'ir iran': 'Iran', iran: 'Iran',
  'cabo verde': 'Cape Verde', 'cape verde': 'Cape Verde', 'cape verde islands': 'Cape Verde',
  'congo dr': 'DR Congo', 'dr congo': 'DR Congo', 'democratic republic of the congo': 'DR Congo', 'congo kinshasa': 'DR Congo',
  'bosnia-herzegovina': 'Bosnia and Herzegovina', 'bosnia and herzegovina': 'Bosnia and Herzegovina', bosnia: 'Bosnia and Herzegovina',
  netherlands: 'Netherlands', holland: 'Netherlands',
  'saudi arabia': 'Saudi Arabia',
  'new zealand': 'New Zealand',
  curacao: 'Curaçao', 'curaçao': 'Curaçao',
};

function statusFromProvider(s: string): SourceFixture['status'] {
  const v = s.toUpperCase();
  if (['IN_PLAY', 'PAUSED', 'LIVE', 'HT'].includes(v)) return 'live';
  if (['FINISHED', 'AET', 'PEN', 'FT', 'AWARDED'].includes(v)) return 'finished';
  return 'scheduled';
}

function validScore(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 30;
}

async function fetchJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(25_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}`);
  return res.json();
}

// ── Source 1: football-data.org ──────────────────────────────────────────────
async function fromFootballData(): Promise<SourceFixture[]> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) throw new Error('FOOTBALL_DATA_API_KEY not configured');
  const data = (await fetchJson(
    'https://api.football-data.org/v4/competitions/2000/matches',
    { 'X-Auth-Token': key }
  )) as {
    matches?: {
      homeTeam?: { name?: string }; awayTeam?: { name?: string };
      score?: {
        fullTime?: { home?: number | null; away?: number | null };
        penalties?: { home?: number | null; away?: number | null };
      };
      status?: string;
    }[];
  };
  if (!Array.isArray(data.matches)) throw new Error('Unexpected football-data.org payload');
  return data.matches
    .filter((m) => m.homeTeam?.name && m.awayTeam?.name)
    .map((m) => ({
      matchNumber: null,
      home: m.homeTeam!.name!,
      away: m.awayTeam!.name!,
      homeScore: validScore(m.score?.fullTime?.home) ? m.score!.fullTime!.home! : null,
      awayScore: validScore(m.score?.fullTime?.away) ? m.score!.fullTime!.away! : null,
      homePens: validScore(m.score?.penalties?.home) ? m.score!.penalties!.home! : null,
      awayPens: validScore(m.score?.penalties?.away) ? m.score!.penalties!.away! : null,
      status: statusFromProvider(m.status ?? ''),
    }));
}

// ── Source 2: openfootball (public JSON, best-effort) ───────────────────────
async function fromOpenFootball(): Promise<SourceFixture[]> {
  const data = (await fetchJson(
    'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'
  )) as {
    rounds?: { matches?: {
      num?: number;
      team1?: { name?: string } | string; team2?: { name?: string } | string;
      score1?: number | null; score2?: number | null;
    }[] }[];
  };
  if (!Array.isArray(data.rounds)) throw new Error('Unexpected openfootball payload');
  const name = (t: { name?: string } | string | undefined) =>
    typeof t === 'string' ? t : t?.name ?? '';
  const out: SourceFixture[] = [];
  for (const round of data.rounds) {
    for (const m of round.matches ?? []) {
      if (!name(m.team1) || !name(m.team2)) continue;
      const finished = validScore(m.score1) && validScore(m.score2);
      out.push({
        matchNumber: typeof m.num === 'number' ? m.num : null,
        home: name(m.team1), away: name(m.team2),
        homeScore: finished ? (m.score1 as number) : null,
        awayScore: finished ? (m.score2 as number) : null,
        homePens: null, awayPens: null,
        status: finished ? 'finished' : 'scheduled',
      });
    }
  }
  return out;
}

// ── Team-name resolution ─────────────────────────────────────────────────────
async function buildNameResolver(db: Database.Database, fixtures: SourceFixture[]) {
  const teams = db.prepare('SELECT id, code, name FROM teams').all() as
    { id: number; code: string; name: string }[];
  const byName = new Map<string, number>();
  teams.forEach((t) => {
    byName.set(t.name.toLowerCase(), t.id);
    byName.set(t.code.toLowerCase(), t.id);
  });
  Object.entries(TEAM_ALIASES).forEach(([alias, canonical]) => {
    const id = byName.get(canonical.toLowerCase());
    if (id) byName.set(alias, id);
  });

  // collect names we still can't resolve and ask OpenAI to map them (optional)
  const unresolved = new Set<string>();
  for (const f of fixtures) {
    if (!byName.has(f.home.toLowerCase())) unresolved.add(f.home);
    if (!byName.has(f.away.toLowerCase())) unresolved.add(f.away);
  }
  if (unresolved.size && openAiAvailable()) {
    const mapping = await mapTeamNames([...unresolved], teams.map((t) => t.name));
    if (mapping) {
      for (const [input, canonical] of Object.entries(mapping)) {
        if (canonical) {
          const id = byName.get(canonical.toLowerCase());
          if (id) byName.set(input.toLowerCase(), id);
        }
      }
    }
  }
  return (n: string) => byName.get(n.toLowerCase()) ?? null;
}

// ── Apply updates ────────────────────────────────────────────────────────────
function applyFixtures(
  db: Database.Database,
  fixtures: SourceFixture[],
  resolve: (n: string) => number | null
): number {
  const byNumber = db.prepare(
    'SELECT id, status, home_team_id, away_team_id FROM matches WHERE id = ?'
  );
  const byTeams = db.prepare(`
    SELECT id, status, home_team_id, away_team_id FROM matches
    WHERE (home_team_id = @h AND away_team_id = @a) OR (home_team_id = @a AND away_team_id = @h)
  `);
  const update = db.prepare(`
    UPDATE matches SET home_score=?, away_score=?, home_penalties=?, away_penalties=?, status=? WHERE id=?
  `);

  let updated = 0;
  const tx = db.transaction(() => {
    for (const f of fixtures) {
      const homeId = resolve(f.home);
      const awayId = resolve(f.away);
      if (!homeId || !awayId) continue;

      let row = (f.matchNumber ? byNumber.get(f.matchNumber) : undefined) as
        | { id: number; status: string; home_team_id: number | null; away_team_id: number | null }
        | undefined;
      if (!row || (row.home_team_id !== homeId && row.away_team_id !== homeId)) {
        row = byTeams.get({ h: homeId, a: awayId }) as typeof row;
      }
      if (!row) continue;

      // orientation: source may list teams in the opposite order
      const flipped = row.home_team_id === awayId && row.away_team_id === homeId;
      const hs = flipped ? f.awayScore : f.homeScore;
      const as_ = flipped ? f.homeScore : f.awayScore;
      const hp = flipped ? f.awayPens : f.homePens;
      const ap = flipped ? f.homePens : f.awayPens;

      // guard: never downgrade a finished match back to scheduled with no score
      if (row.status === 'finished' && f.status === 'scheduled') continue;
      if (f.status !== 'scheduled' && (hs === null || as_ === null)) continue;

      const current = db.prepare(
        'SELECT home_score, away_score, status FROM matches WHERE id = ?'
      ).get(row.id) as { home_score: number | null; away_score: number | null; status: string };
      if (current.home_score === hs && current.away_score === as_ && current.status === f.status) continue;

      update.run(hs, as_, hp, ap, f.status, row.id);
      updated++;
    }
  });
  tx();
  return updated;
}

// ── Public entry point ───────────────────────────────────────────────────────
export async function runRefresh(db: Database.Database): Promise<RefreshResult> {
  const ranAt = new Date().toISOString();
  const errors: string[] = [];
  let fixtures: SourceFixture[] | null = null;
  let source = 'none';

  if (process.env.FOOTBALL_DATA_API_KEY) {
    try {
      fixtures = await fromFootballData();
      source = 'football-data.org';
    } catch (e) {
      errors.push(`football-data.org: ${(e as Error).message}`);
    }
  } else {
    errors.push('football-data.org: no API key configured (set FOOTBALL_DATA_API_KEY)');
  }

  if (!fixtures) {
    try {
      fixtures = await fromOpenFootball();
      source = 'openfootball';
    } catch (e) {
      errors.push(`openfootball: ${(e as Error).message}`);
    }
  }

  let matchesUpdated = 0;
  let ok = false;
  let message: string;

  if (fixtures && fixtures.length) {
    const resolve = await buildNameResolver(db, fixtures);
    matchesUpdated = applyFixtures(db, fixtures, resolve);
    ok = true;
    message = `Fetched ${fixtures.length} fixtures from ${source}; updated ${matchesUpdated} matches.`;
  } else {
    message = `No external data available. ${errors.join(' | ')}`;
  }

  // Always recalculate from whatever is in the DB (manual edits included)
  recalculateStandings(db);
  const knockoutSlotsResolved = resolveKnockout(db);

  let friendlyError: string | undefined;
  if (!ok && openAiAvailable()) {
    friendlyError = (await explainError(message)) ?? undefined;
  }

  db.prepare(
    'INSERT INTO refresh_logs (ran_at, source, ok, matches_updated, message) VALUES (?, ?, ?, ?, ?)'
  ).run(ranAt, source, ok ? 1 : 0, matchesUpdated, message);

  return {
    ok, source, matchesUpdated,
    standingsRecalculated: true,
    knockoutSlotsResolved,
    message, friendlyError, ranAt,
  };
}
