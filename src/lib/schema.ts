// SQLite schema — single source of truth, applied by db.ts and scripts/seed.ts
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS teams (
  id            INTEGER PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL UNIQUE,
  group_letter  TEXT NOT NULL CHECK (group_letter BETWEEN 'A' AND 'L')
);

CREATE TABLE IF NOT EXISTS groups (
  letter TEXT PRIMARY KEY CHECK (letter BETWEEN 'A' AND 'L'),
  name   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS venues (
  id                 INTEGER PRIMARY KEY,
  key                TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  city               TEXT NOT NULL,
  country            TEXT NOT NULL CHECK (country IN ('USA','Canada','Mexico')),
  timezone           TEXT NOT NULL,
  utc_offset_minutes INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  id               INTEGER PRIMARY KEY, -- FIFA match number 1..104
  stage            TEXT NOT NULL CHECK (stage IN ('GROUP','R32','R16','QF','SF','THIRD','FINAL')),
  group_letter     TEXT,
  home_team_id     INTEGER REFERENCES teams(id),
  away_team_id     INTEGER REFERENCES teams(id),
  home_placeholder TEXT,
  away_placeholder TEXT,
  venue_id         INTEGER NOT NULL REFERENCES venues(id),
  kickoff_utc      TEXT NOT NULL,
  time_confirmed   INTEGER NOT NULL DEFAULT 1,
  home_score       INTEGER,
  away_score       INTEGER,
  home_penalties   INTEGER,
  away_penalties   INTEGER,
  status           TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','finished'))
);

CREATE TABLE IF NOT EXISTS standings (
  group_letter    TEXT NOT NULL,
  team_id         INTEGER NOT NULL REFERENCES teams(id),
  position        INTEGER NOT NULL,
  played          INTEGER NOT NULL DEFAULT 0,
  won             INTEGER NOT NULL DEFAULT 0,
  drawn           INTEGER NOT NULL DEFAULT 0,
  lost            INTEGER NOT NULL DEFAULT 0,
  goals_for       INTEGER NOT NULL DEFAULT 0,
  goals_against   INTEGER NOT NULL DEFAULT 0,
  goal_difference INTEGER NOT NULL DEFAULT 0,
  points          INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (group_letter, team_id)
);

CREATE TABLE IF NOT EXISTS knockout_mapping (
  match_id  INTEGER NOT NULL REFERENCES matches(id),
  side      TEXT NOT NULL CHECK (side IN ('home','away')),
  slot_type TEXT NOT NULL CHECK (slot_type IN ('GROUP_WINNER','GROUP_RUNNERUP','THIRD_POOL','MATCH_WINNER','MATCH_LOSER')),
  ref       TEXT NOT NULL,
  PRIMARY KEY (match_id, side)
);

CREATE TABLE IF NOT EXISTS refresh_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  ran_at          TEXT NOT NULL,
  source          TEXT NOT NULL,
  ok              INTEGER NOT NULL,
  matches_updated INTEGER NOT NULL DEFAULT 0,
  message         TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches (kickoff_utc);
CREATE INDEX IF NOT EXISTS idx_matches_group ON matches (group_letter);
CREATE INDEX IF NOT EXISTS idx_matches_stage ON matches (stage);
`;
