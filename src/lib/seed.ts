import type Database from 'better-sqlite3';
import { GROUPS, TEAMS, VENUES, GROUP_MATCHES, KNOCKOUT_MATCHES } from './seed-data';
import { localToUtcIso } from './time';
import { recalculateStandings } from './standings';
import { resolveKnockout } from './knockout';

/** (Re)seed the database with the full official 104-match structure. */
export function seedDatabase(db: Database.Database): { teams: number; matches: number } {
  const run = db.transaction(() => {
    db.exec(`
      DELETE FROM knockout_mapping;
      DELETE FROM standings;
      DELETE FROM matches;
      DELETE FROM teams;
      DELETE FROM groups;
      DELETE FROM venues;
    `);

    const insGroup = db.prepare('INSERT INTO groups (letter, name) VALUES (?, ?)');
    GROUPS.forEach((g) => insGroup.run(g, `Group ${g}`));

    const insVenue = db.prepare(
      'INSERT INTO venues (key, name, city, country, timezone, utc_offset_minutes) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const venueIds = new Map<string, number>();
    VENUES.forEach((v) => {
      const r = insVenue.run(v.key, v.name, v.city, v.country, v.timezone, v.utcOffsetMinutes);
      venueIds.set(v.key, Number(r.lastInsertRowid));
    });

    const insTeam = db.prepare('INSERT INTO teams (code, name, group_letter) VALUES (?, ?, ?)');
    const teamIds = new Map<string, number>();
    TEAMS.forEach((t) => {
      const r = insTeam.run(t.code, t.name, t.group);
      teamIds.set(t.code, Number(r.lastInsertRowid));
    });

    const insMatch = db.prepare(`
      INSERT INTO matches (id, stage, group_letter, home_team_id, away_team_id,
        home_placeholder, away_placeholder, venue_id, kickoff_utc, time_confirmed,
        home_score, away_score, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const m of GROUP_MATCHES) {
      const venue = VENUES.find((v) => v.key === m.venue)!;
      insMatch.run(
        m.n, 'GROUP', m.group,
        teamIds.get(m.home)!, teamIds.get(m.away)!,
        null, null,
        venueIds.get(m.venue)!,
        localToUtcIso(m.date, m.localTime, venue.utcOffsetMinutes),
        m.timeConfirmed === false ? 0 : 1,
        m.homeScore ?? null, m.awayScore ?? null,
        m.status ?? 'scheduled'
      );
    }

    const insMap = db.prepare(
      'INSERT INTO knockout_mapping (match_id, side, slot_type, ref) VALUES (?, ?, ?, ?)'
    );
    for (const m of KNOCKOUT_MATCHES) {
      const venue = VENUES.find((v) => v.key === m.venue)!;
      insMatch.run(
        m.n, m.stage, null, null, null,
        m.home.label, m.away.label,
        venueIds.get(m.venue)!,
        localToUtcIso(m.date, m.localTime, venue.utcOffsetMinutes),
        m.timeConfirmed === false ? 0 : 1,
        null, null, 'scheduled'
      );
      insMap.run(m.n, 'home', m.home.type, m.home.ref);
      insMap.run(m.n, 'away', m.away.type, m.away.ref);
    }
  });
  run();

  recalculateStandings(db);
  resolveKnockout(db);

  return { teams: TEAMS.length, matches: GROUP_MATCHES.length + KNOCKOUT_MATCHES.length };
}
