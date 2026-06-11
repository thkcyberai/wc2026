import type Database from 'better-sqlite3';
import { GROUPS } from './seed-data';
import type { QualStatus } from './types';

interface Tally {
  team_id: number;
  group_letter: string;
  played: number; won: number; drawn: number; lost: number;
  gf: number; ga: number; pts: number;
}

interface FinishedMatch {
  group_letter: string;
  home_team_id: number; away_team_id: number;
  home_score: number; away_score: number;
}

function emptyTally(team_id: number, group_letter: string): Tally {
  return { team_id, group_letter, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
}

function applyMatch(t: Map<number, Tally>, m: FinishedMatch) {
  const h = t.get(m.home_team_id)!;
  const a = t.get(m.away_team_id)!;
  h.played++; a.played++;
  h.gf += m.home_score; h.ga += m.away_score;
  a.gf += m.away_score; a.ga += m.home_score;
  if (m.home_score > m.away_score) { h.won++; a.lost++; h.pts += 3; }
  else if (m.home_score < m.away_score) { a.won++; h.lost++; a.pts += 3; }
  else { h.drawn++; a.drawn++; h.pts++; a.pts++; }
}

/**
 * Sort group teams per FIFA rules:
 * points → goal difference → goals for → head-to-head among tied teams
 * (points, GD, GF in the mini-table) → team name (deterministic fallback;
 * FIFA uses fair play + drawing of lots which require data we don't store).
 */
function sortGroup(tallies: Tally[], matches: FinishedMatch[], names: Map<number, string>): Tally[] {
  const base = (x: Tally, y: Tally) =>
    y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf;

  const sorted = [...tallies].sort(base);

  // resolve remaining ties with head-to-head mini-table
  for (let i = 0; i < sorted.length;) {
    let j = i + 1;
    while (j < sorted.length && base(sorted[i], sorted[j]) === 0) j++;
    if (j - i > 1) {
      const tiedIds = new Set(sorted.slice(i, j).map((t) => t.team_id));
      const mini = new Map<number, Tally>();
      tiedIds.forEach((id) => mini.set(id, emptyTally(id, sorted[i].group_letter)));
      matches
        .filter((m) => tiedIds.has(m.home_team_id) && tiedIds.has(m.away_team_id))
        .forEach((m) => applyMatch(mini, m));
      const sub = sorted.slice(i, j).sort((x, y) => {
        const mx = mini.get(x.team_id)!; const my = mini.get(y.team_id)!;
        return (
          my.pts - mx.pts ||
          (my.gf - my.ga) - (mx.gf - mx.ga) ||
          my.gf - mx.gf ||
          (names.get(x.team_id) || '').localeCompare(names.get(y.team_id) || '')
        );
      });
      sorted.splice(i, j - i, ...sub);
    }
    i = j;
  }
  return sorted;
}

/**
 * Rank third-placed teams across groups: points → GD → GF → team name.
 * (FIFA additionally uses fair-play points and world ranking; card data is
 * not tracked locally, so name is the deterministic final fallback.)
 */
export function rankThirds(thirds: Tally[], names: Map<number, string>): Tally[] {
  return [...thirds].sort(
    (x, y) =>
      y.pts - x.pts ||
      (y.gf - y.ga) - (x.gf - x.ga) ||
      y.gf - x.gf ||
      (names.get(x.team_id) || '').localeCompare(names.get(y.team_id) || '')
  );
}

export interface RecalcResult {
  groupsComplete: string[];           // letters with all 6 matches finished
  allGroupsComplete: boolean;
  bestThirds: { team_id: number; group_letter: string }[]; // top 8 (only meaningful when allGroupsComplete)
}

/** Recompute every group table and persist into the standings table. */
export function recalculateStandings(db: Database.Database): RecalcResult {
  const teams = db.prepare('SELECT id, name, group_letter FROM teams').all() as
    { id: number; name: string; group_letter: string }[];
  const names = new Map(teams.map((t) => [t.id, t.name]));

  const finished = db.prepare(`
    SELECT group_letter, home_team_id, away_team_id, home_score, away_score
    FROM matches
    WHERE stage = 'GROUP' AND status = 'finished'
      AND home_team_id IS NOT NULL AND away_team_id IS NOT NULL
      AND home_score IS NOT NULL AND away_score IS NOT NULL
  `).all() as FinishedMatch[];

  const groupsComplete: string[] = [];
  const thirds: Tally[] = [];
  const ordered = new Map<string, Tally[]>();

  for (const letter of GROUPS) {
    const groupTeams = teams.filter((t) => t.group_letter === letter);
    const tallies = new Map<number, Tally>();
    groupTeams.forEach((t) => tallies.set(t.id, emptyTally(t.id, letter)));
    const groupMatches = finished.filter((m) => m.group_letter === letter);
    groupMatches.forEach((m) => applyMatch(tallies, m));
    const sorted = sortGroup([...tallies.values()], groupMatches, names);
    ordered.set(letter, sorted);
    if (groupMatches.length === 6) groupsComplete.push(letter);
    if (sorted[2]) thirds.push(sorted[2]);
  }

  const allGroupsComplete = groupsComplete.length === 12;
  const rankedThirds = rankThirds(
    thirds.filter((t) => groupsComplete.includes(t.group_letter)),
    names
  );
  const bestThirdIds = new Set(
    allGroupsComplete ? rankedThirds.slice(0, 8).map((t) => t.team_id) : []
  );

  const upsert = db.prepare(`
    INSERT INTO standings (group_letter, team_id, position, played, won, drawn, lost,
      goals_for, goals_against, goal_difference, points, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (group_letter, team_id) DO UPDATE SET
      position=excluded.position, played=excluded.played, won=excluded.won,
      drawn=excluded.drawn, lost=excluded.lost, goals_for=excluded.goals_for,
      goals_against=excluded.goals_against, goal_difference=excluded.goal_difference,
      points=excluded.points, status=excluded.status
  `);

  const writeAll = db.transaction(() => {
    for (const letter of GROUPS) {
      const sorted = ordered.get(letter)!;
      const complete = groupsComplete.includes(letter);
      sorted.forEach((t, idx) => {
        const pos = idx + 1;
        let status: QualStatus = '';
        if (complete) {
          if (pos <= 2) status = 'qualified';
          else if (pos === 3) {
            status = allGroupsComplete
              ? (bestThirdIds.has(t.team_id) ? 'qualified' : 'eliminated')
              : 'best-third';
          } else status = 'eliminated';
        } else if (t.played > 0) {
          status = 'in-contention';
        }
        upsert.run(letter, t.team_id, pos, t.played, t.won, t.drawn, t.lost,
          t.gf, t.ga, t.gf - t.ga, t.pts, status);
      });
    }
  });
  writeAll();

  return {
    groupsComplete,
    allGroupsComplete,
    bestThirds: rankedThirds.slice(0, 8).map((t) => ({ team_id: t.team_id, group_letter: t.group_letter })),
  };
}
