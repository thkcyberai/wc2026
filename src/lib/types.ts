// Shared domain types for WC2026 Calendar Tracker

export type Stage =
  | 'GROUP'
  | 'R32'
  | 'R16'
  | 'QF'
  | 'SF'
  | 'THIRD'
  | 'FINAL';

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface Team {
  id: number;
  code: string; // FIFA trigram e.g. MEX
  name: string;
  group_letter: string; // A..L
}

export interface Venue {
  id: number;
  key: string;
  name: string;
  city: string;
  country: 'USA' | 'Canada' | 'Mexico';
  timezone: string; // IANA
  utc_offset_minutes: number; // fixed during tournament window
}

export interface MatchRow {
  id: number; // FIFA match number 1..104
  stage: Stage;
  group_letter: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  home_placeholder: string | null;
  away_placeholder: string | null;
  venue_id: number;
  kickoff_utc: string; // ISO 8601 UTC
  time_confirmed: number; // 0|1
  home_score: number | null;
  away_score: number | null;
  home_penalties: number | null;
  away_penalties: number | null;
  status: MatchStatus;
}

export interface MatchView extends MatchRow {
  home_team: Team | null;
  away_team: Team | null;
  venue: Venue;
  times: {
    venue: string;
    lisboa: string;
    colorado: string;
    brasil: string;
  };
  date_venue: string; // YYYY-MM-DD at venue
  stage_label: string;
  events: MatchEvent[];
}

export type QualStatus =
  | 'qualified'        // confirmed in R32 (top-2 or locked best third)
  | 'best-third'       // currently among 8 best thirds (groups complete)
  | 'in-contention'
  | 'eliminated'
  | '';

export interface StandingRow {
  team_id: number;
  team: Team;
  group_letter: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  status: QualStatus;
}

export interface GroupView {
  letter: string;
  complete: boolean;
  standings: StandingRow[];
}

export type SlotType =
  | 'GROUP_WINNER'   // ref = group letter
  | 'GROUP_RUNNERUP' // ref = group letter
  | 'THIRD_POOL'     // ref = comma list of candidate groups e.g. "A,B,C,D,F"
  | 'MATCH_WINNER'   // ref = match number
  | 'MATCH_LOSER';   // ref = match number

export interface KnockoutMapping {
  match_id: number;
  side: 'home' | 'away';
  slot_type: SlotType;
  ref: string;
}

export interface Player {
  id: number;
  af_id: number | null;
  team_id: number;
  name: string;
  position: string | null;
  shirt_number: number | null;
  photo_url: string | null;
}

export type MatchEventType = 'goal' | 'own-goal' | 'penalty' | 'yellow' | 'red';

export interface MatchEvent {
  id: number;
  match_id: number;
  team_id: number | null;
  player_id: number | null;
  player_name: string;
  type: MatchEventType;
  minute: number | null;
  minute_extra: number | null;
}

export interface RefreshLog {
  id: number;
  ran_at: string;
  source: string;
  ok: number;
  matches_updated: number;
  message: string;
}

export interface RefreshResult {
  ok: boolean;
  source: string;
  matchesUpdated: number;
  standingsRecalculated: boolean;
  knockoutSlotsResolved: number;
  message: string;
  friendlyError?: string;
  ranAt: string;
}
