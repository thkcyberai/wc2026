import type Database from 'better-sqlite3';
import { recalculateStandings } from './standings';

/**
 * Resolve knockout placeholders into real teams wherever results allow:
 *  - GROUP_WINNER / GROUP_RUNNERUP → from standings once the group is complete
 *  - THIRD_POOL → once ALL groups are complete, allocate the 8 best thirds to
 *    their R32 slots by backtracking over each slot's allowed group pool
 *    (mirrors FIFA's Annex C allocation table constraints)
 *  - MATCH_WINNER / MATCH_LOSER → once the referenced match is finished
 * Returns how many slots were resolved in this pass.
 */
export function resolveKnockout(db: Database.Database): number {
  const recalc = recalculateStandings(db);
  let resolved = 0;

  const mappings = db.prepare(`
    SELECT km.match_id, km.side, km.slot_type, km.ref
    FROM knockout_mapping km
    JOIN matches m ON m.id = km.match_id
    ORDER BY km.match_id
  `).all() as { match_id: number; side: 'home' | 'away'; slot_type: string; ref: string }[];

  const getStanding = db.prepare(
    'SELECT team_id FROM standings WHERE group_letter = ? AND position = ?'
  );
  const getMatch = db.prepare(
    'SELECT home_team_id, away_team_id, home_score, away_score, home_penalties, away_penalties, status FROM matches WHERE id = ?'
  );
  const setTeam = (matchId: number, side: 'home' | 'away', teamId: number | null) => {
    const col = side === 'home' ? 'home_team_id' : 'away_team_id';
    const current = db.prepare(`SELECT ${col} AS v FROM matches WHERE id = ?`).get(matchId) as { v: number | null };
    if ((current?.v ?? null) !== teamId) {
      db.prepare(`UPDATE matches SET ${col} = ? WHERE id = ?`).run(teamId, matchId);
      if (teamId !== null) resolved++;
    }
  };

  // ── Third-place allocation (backtracking over slot pools) ──
  let thirdAssignment: Map<number, number> | null = null; // match_id -> team_id
  if (recalc.allGroupsComplete) {
    const slots = mappings.filter((m) => m.slot_type === 'THIRD_POOL');
    const thirdsByGroup = new Map(recalc.bestThirds.map((t) => [t.group_letter, t.team_id]));
    const qualifiedGroups = recalc.bestThirds.map((t) => t.group_letter);

    const slotPools = slots.map((s) => ({
      match_id: s.match_id,
      pool: s.ref.split(',').filter((g) => qualifiedGroups.includes(g)),
    }));
    // most-constrained-first improves backtracking
    slotPools.sort((a, b) => a.pool.length - b.pool.length);

    const used = new Set<string>();
    const assign = new Map<number, string>(); // match_id -> group letter

    const backtrack = (i: number): boolean => {
      if (i === slotPools.length) return true;
      const slot = slotPools[i];
      for (const g of slot.pool) {
        if (used.has(g)) continue;
        used.add(g); assign.set(slot.match_id, g);
        if (backtrack(i + 1)) return true;
        used.delete(g); assign.delete(slot.match_id);
      }
      return false;
    };

    if (backtrack(0)) {
      thirdAssignment = new Map(
        [...assign.entries()].map(([mid, g]) => [mid, thirdsByGroup.get(g)!])
      );
    }
  }

  const apply = db.transaction(() => {
    for (const m of mappings) {
      switch (m.slot_type) {
        case 'GROUP_WINNER':
        case 'GROUP_RUNNERUP': {
          if (!recalc.groupsComplete.includes(m.ref)) { setTeam(m.match_id, m.side, null); break; }
          const pos = m.slot_type === 'GROUP_WINNER' ? 1 : 2;
          const row = getStanding.get(m.ref, pos) as { team_id: number } | undefined;
          setTeam(m.match_id, m.side, row?.team_id ?? null);
          break;
        }
        case 'THIRD_POOL': {
          setTeam(m.match_id, m.side, thirdAssignment?.get(m.match_id) ?? null);
          break;
        }
        case 'MATCH_WINNER':
        case 'MATCH_LOSER': {
          const src = getMatch.get(Number(m.ref)) as {
            home_team_id: number | null; away_team_id: number | null;
            home_score: number | null; away_score: number | null;
            home_penalties: number | null; away_penalties: number | null;
            status: string;
          } | undefined;
          if (!src || src.status !== 'finished' || src.home_score === null || src.away_score === null
            || src.home_team_id === null || src.away_team_id === null) {
            setTeam(m.match_id, m.side, null); break;
          }
          let homeWins: boolean;
          if (src.home_score !== src.away_score) homeWins = src.home_score > src.away_score;
          else if (src.home_penalties !== null && src.away_penalties !== null && src.home_penalties !== src.away_penalties)
            homeWins = src.home_penalties > src.away_penalties;
          else { setTeam(m.match_id, m.side, null); break; } // unresolved draw
          const winner = homeWins ? src.home_team_id : src.away_team_id;
          const loser = homeWins ? src.away_team_id : src.home_team_id;
          setTeam(m.match_id, m.side, m.slot_type === 'MATCH_WINNER' ? winner : loser);
          break;
        }
      }
    }
  });
  apply();

  return resolved;
}
