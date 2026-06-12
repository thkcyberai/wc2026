import { getDb } from './db';
import { DISPLAY_ZONES, formatInZone, dayShift, dateInZone, prettyDate } from './time';
import type { GroupView, MatchEvent, MatchView, StandingRow, Stage, Team, Venue } from './types';
import { GROUPS } from './seed-data';

const STAGE_LABELS: Record<Stage, string> = {
  GROUP: 'Group Stage',
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter-final',
  SF: 'Semi-final',
  THIRD: 'Third-place match',
  FINAL: 'Final',
};

interface RawJoined {
  id: number; stage: Stage; group_letter: string | null;
  home_team_id: number | null; away_team_id: number | null;
  home_placeholder: string | null; away_placeholder: string | null;
  venue_id: number; kickoff_utc: string; time_confirmed: number;
  home_score: number | null; away_score: number | null;
  home_penalties: number | null; away_penalties: number | null;
  status: 'scheduled' | 'live' | 'finished';
  h_code: string | null; h_name: string | null; h_group: string | null;
  a_code: string | null; a_name: string | null; a_group: string | null;
  v_key: string; v_name: string; v_city: string; v_country: string;
  v_tz: string; v_off: number;
}

const MATCH_SELECT = `
  SELECT m.*,
    ht.code AS h_code, ht.name AS h_name, ht.group_letter AS h_group,
    at.code AS a_code, at.name AS a_name, at.group_letter AS a_group,
    v.key AS v_key, v.name AS v_name, v.city AS v_city, v.country AS v_country,
    v.timezone AS v_tz, v.utc_offset_minutes AS v_off
  FROM matches m
  LEFT JOIN teams ht ON ht.id = m.home_team_id
  LEFT JOIN teams at ON at.id = m.away_team_id
  JOIN venues v ON v.id = m.venue_id
`;

function getAllEvents(): Map<number, MatchEvent[]> {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM match_events
    ORDER BY match_id, COALESCE(minute, 0), COALESCE(minute_extra, 0), id
  `).all() as MatchEvent[];
  const map = new Map<number, MatchEvent[]>();
  for (const e of rows) {
    const list = map.get(e.match_id) ?? [];
    list.push(e);
    map.set(e.match_id, list);
  }
  return map;
}

function toView(r: RawJoined, events?: Map<number, MatchEvent[]>): MatchView {
  const venue: Venue = {
    id: r.venue_id, key: r.v_key, name: r.v_name, city: r.v_city,
    country: r.v_country as Venue['country'], timezone: r.v_tz, utc_offset_minutes: r.v_off,
  };
  const home: Team | null = r.home_team_id
    ? { id: r.home_team_id, code: r.h_code!, name: r.h_name!, group_letter: r.h_group! }
    : null;
  const away: Team | null = r.away_team_id
    ? { id: r.away_team_id, code: r.a_code!, name: r.a_name!, group_letter: r.a_group! }
    : null;

  return {
    id: r.id, stage: r.stage, group_letter: r.group_letter,
    home_team_id: r.home_team_id, away_team_id: r.away_team_id,
    home_placeholder: r.home_placeholder, away_placeholder: r.away_placeholder,
    venue_id: r.venue_id, kickoff_utc: r.kickoff_utc, time_confirmed: r.time_confirmed,
    home_score: r.home_score, away_score: r.away_score,
    home_penalties: r.home_penalties, away_penalties: r.away_penalties,
    status: r.status,
    home_team: home, away_team: away, venue,
    date_venue: dateInZone(r.kickoff_utc, venue.timezone),
    stage_label: r.stage === 'GROUP' && r.group_letter
      ? `Group ${r.group_letter}`
      : STAGE_LABELS[r.stage],
    events: events?.get(r.id) ?? [],
    times: {
      venue: `${formatInZone(r.kickoff_utc, venue.timezone)}`,
      lisboa: `${formatInZone(r.kickoff_utc, DISPLAY_ZONES.lisboa)}${dayShift(r.kickoff_utc, DISPLAY_ZONES.lisboa, venue.timezone)}`,
      colorado: `${formatInZone(r.kickoff_utc, DISPLAY_ZONES.colorado)}${dayShift(r.kickoff_utc, DISPLAY_ZONES.colorado, venue.timezone)}`,
      brasil: `${formatInZone(r.kickoff_utc, DISPLAY_ZONES.brasil)}${dayShift(r.kickoff_utc, DISPLAY_ZONES.brasil, venue.timezone)}`,
    },
  };
}

export function getAllMatches(): MatchView[] {
  const db = getDb();
  const rows = db.prepare(`${MATCH_SELECT} ORDER BY m.kickoff_utc, m.id`).all() as RawJoined[];
  const events = getAllEvents();
  return rows.map((r) => toView(r, events));
}

export function getMatchesByIds(ids: number[]): MatchView[] {
  if (!ids.length) return [];
  const db = getDb();
  const rows = db
    .prepare(`${MATCH_SELECT} WHERE m.id IN (${ids.map(() => '?').join(',')}) ORDER BY m.kickoff_utc`)
    .all(...ids) as RawJoined[];
  const events = getAllEvents();
  return rows.map((r) => toView(r, events));
}

export function getDashboard() {
  const all = getAllMatches();
  const now = Date.now();
  const today = dateInZone(new Date(now).toISOString(), 'America/Denver'); // user's reference day (Colorado)

  const todays = all.filter((m) => dateInZone(m.kickoff_utc, m.venue.timezone) === today
    || dateInZone(m.kickoff_utc, 'America/Denver') === today);
  const live = all.filter((m) => m.status === 'live');
  const finished = all.filter((m) => m.status === 'finished');
  const latest = finished.slice(-6).reverse();
  const upcoming = all
    .filter((m) => m.status === 'scheduled' && new Date(m.kickoff_utc).getTime() >= now)
    .slice(0, 6);

  return { today, todays, live, latest, upcoming };
}

export function getGroups(): GroupView[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT s.*, t.code, t.name
    FROM standings s JOIN teams t ON t.id = s.team_id
    ORDER BY s.group_letter, s.position
  `).all() as (StandingRow & { code: string; name: string })[];

  const finishedCounts = db.prepare(`
    SELECT group_letter, COUNT(*) AS n FROM matches
    WHERE stage='GROUP' AND status='finished' GROUP BY group_letter
  `).all() as { group_letter: string; n: number }[];
  const fin = new Map(finishedCounts.map((r) => [r.group_letter, r.n]));

  return GROUPS.map((letter) => ({
    letter,
    complete: (fin.get(letter) ?? 0) === 6,
    standings: rows
      .filter((r) => r.group_letter === letter)
      .map((r) => ({
        team_id: r.team_id,
        team: { id: r.team_id, code: r.code, name: r.name, group_letter: letter },
        group_letter: letter,
        position: r.position, played: r.played, won: r.won, drawn: r.drawn, lost: r.lost,
        goals_for: r.goals_for, goals_against: r.goals_against,
        goal_difference: r.goal_difference, points: r.points,
        status: r.status as StandingRow['status'],
      })),
  }));
}

export function getKnockout() {
  const all = getAllMatches().filter((m) => m.stage !== 'GROUP');
  const byStage = (s: Stage) => all.filter((m) => m.stage === s).sort((a, b) => a.id - b.id);
  return {
    r32: byStage('R32'),
    r16: byStage('R16'),
    qf: byStage('QF'),
    sf: byStage('SF'),
    third: byStage('THIRD'),
    final: byStage('FINAL'),
  };
}

export function getLastRefresh() {
  const db = getDb();
  return db.prepare('SELECT * FROM refresh_logs ORDER BY id DESC LIMIT 1').get() ?? null;
}

export function getRefreshLogs(limit = 20) {
  const db = getDb();
  return db.prepare('SELECT * FROM refresh_logs ORDER BY id DESC LIMIT ?').all(limit);
}

export function getMeta() {
  const db = getDb();
  const teams = db.prepare('SELECT COUNT(*) AS n FROM teams').get() as { n: number };
  const matches = db.prepare('SELECT COUNT(*) AS n FROM matches').get() as { n: number };
  const finished = db.prepare("SELECT COUNT(*) AS n FROM matches WHERE status='finished'").get() as { n: number };
  return {
    teams: teams.n,
    matches: matches.n,
    finished: finished.n,
    lastRefresh: getLastRefresh(),
    prettyToday: prettyDate(new Date().toISOString(), 'America/Denver'),
  };
}
