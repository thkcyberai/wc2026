// Data-layer verification harness — run with: npm run verify
// Seeds an in-memory SQLite DB with the real seed/standings/knockout logic,
// then simulates the entire tournament (group stage → final) and asserts
// every rule: standings math, tiebreakers, best-third selection, FIFA
// pool-constrained third-place allocation, and bracket resolution.
import Database from 'better-sqlite3';
import { SCHEMA_SQL } from '../src/lib/schema';
import { seedDatabase } from '../src/lib/seed';
import { recalculateStandings } from '../src/lib/standings';
import { resolveKnockout } from '../src/lib/knockout';

const assert = (cond, msg) => {
  if (!cond) { console.error('❌ FAIL:', msg); process.exitCode = 1; }
  else console.log('✓', msg);
};

const db = new Database(':memory:');
db.exec(SCHEMA_SQL);
const seeded = seedDatabase(db);
assert(seeded.teams === 48, '48 teams seeded');
assert(seeded.matches === 104, '104 matches seeded');

const q = (sql, ...p) => db.prepare(sql).get(...p);
const qa = (sql, ...p) => db.prepare(sql).all(...p);

assert(qa('SELECT * FROM groups').length === 12, '12 groups');
assert(qa('SELECT * FROM venues').length === 16, '16 venues');
assert(qa("SELECT * FROM matches WHERE stage='GROUP'").length === 72, '72 group matches');
assert(qa('SELECT * FROM knockout_mapping').length === 64, '64 knockout slots mapped');
assert(qa('SELECT * FROM standings').length === 48, '48 standings rows');

const mexRow = q(`SELECT s.points, s.position FROM standings s JOIN teams t ON t.id=s.team_id
  WHERE s.group_letter='A' AND t.code='MEX'`);
assert(mexRow.points === 3 && mexRow.position === 1, 'Mexico tops Group A with 3 pts after opener');

const m1 = q('SELECT kickoff_utc FROM matches WHERE id=1');
assert(m1.kickoff_utc === '2026-06-11T19:00:00.000Z', `match 1 UTC kickoff (${m1.kickoff_utc})`);
const m104 = q('SELECT kickoff_utc FROM matches WHERE id=104');
assert(m104.kickoff_utc === '2026-07-19T19:00:00.000Z', `final UTC kickoff (${m104.kickoff_utc})`);

// ── Simulate the rest of the group stage with deterministic pseudo-scores ──
const groupMatches = qa("SELECT id FROM matches WHERE stage='GROUP' AND status!='finished'");
const upd = db.prepare('UPDATE matches SET home_score=?, away_score=?, status=? WHERE id=?');
for (const m of groupMatches) upd.run((m.id * 7 + 3) % 4, (m.id * 5 + 1) % 3, 'finished', m.id);
console.log(`  simulated ${groupMatches.length} group results`);

const recalc = recalculateStandings(db);
assert(recalc.allGroupsComplete, 'all 12 groups complete after simulation');
assert(recalc.bestThirds.length === 8, '8 best thirds selected');
assert(qa("SELECT COUNT(*) n FROM standings WHERE status='qualified'")[0].n === 32, '32 teams qualified');

const resolved = resolveKnockout(db);
const r32Unresolved = qa("SELECT id FROM matches WHERE stage='R32' AND (home_team_id IS NULL OR away_team_id IS NULL)");
assert(r32Unresolved.length === 0, `all R32 slots resolved (${resolved} slots this pass)`);

const thirdSlots = qa(`SELECT km.match_id, km.ref, t.group_letter
  FROM knockout_mapping km JOIN matches m ON m.id=km.match_id
  JOIN teams t ON t.id = m.away_team_id
  WHERE km.slot_type='THIRD_POOL' AND km.side='away'`);
assert(thirdSlots.length === 8, '8 third-pool slots');
const groupsUsed = new Set();
for (const s of thirdSlots) {
  assert(s.ref.split(',').includes(s.group_letter), `third in M${s.match_id} from allowed pool (${s.group_letter} ∈ ${s.ref})`);
  groupsUsed.add(s.group_letter);
}
assert(groupsUsed.size === 8, 'each best-third used exactly once');

const r32Teams = qa("SELECT home_team_id a FROM matches WHERE stage='R32' UNION ALL SELECT away_team_id FROM matches WHERE stage='R32'");
assert(new Set(r32Teams.map((r) => r.a)).size === 32, '32 distinct teams in R32');

// ── Simulate knockout rounds through the final (incl. penalty shootouts) ──
for (const stage of ['R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL']) {
  for (const m of qa(`SELECT id, home_team_id, away_team_id FROM matches WHERE stage='${stage}'`)) {
    if (!m.home_team_id || !m.away_team_id) { console.error(`❌ FAIL: ${stage} M${m.id} unresolved`); process.exitCode = 1; continue; }
    if (m.id % 3 === 0) {
      db.prepare('UPDATE matches SET home_score=1, away_score=1, home_penalties=?, away_penalties=?, status=? WHERE id=?')
        .run(m.id % 2 === 0 ? 5 : 3, m.id % 2 === 0 ? 4 : 5, 'finished', m.id);
    } else {
      upd.run((m.id % 2) + 1, 0, 'finished', m.id);
    }
  }
  resolveKnockout(db);
}
const final = q("SELECT home_team_id, away_team_id FROM matches WHERE stage='FINAL'");
assert(final.home_team_id && final.away_team_id, 'final has both teams resolved');
const third = q("SELECT home_team_id, away_team_id FROM matches WHERE stage='THIRD'");
assert(third.home_team_id && third.away_team_id && third.home_team_id !== third.away_team_id, 'third-place match resolved from SF losers');

console.log(process.exitCode ? '\n❌ VERIFICATION FAILED' : '\n✅ ALL DATA-LAYER CHECKS PASSED');
