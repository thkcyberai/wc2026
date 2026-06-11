// ─────────────────────────────────────────────────────────────────────────────
// FIFA World Cup 2026 — official tournament structure & schedule
// Groups per the Final Draw (Washington D.C., Dec 5 2025).
// Schedule/venues per FIFA's published 104-match calendar.
// Kickoff times are local venue time; a few are provisional (timeConfirmed=false).
// ─────────────────────────────────────────────────────────────────────────────

export interface SeedTeam { code: string; name: string; group: string }
export interface SeedVenue {
  key: string; name: string; city: string;
  country: 'USA' | 'Canada' | 'Mexico';
  timezone: string; utcOffsetMinutes: number; // fixed during Jun 11–Jul 19 2026
}
export interface SeedGroupMatch {
  n: number; group: string; date: string; localTime: string; venue: string;
  home: string; away: string;
  homeScore?: number; awayScore?: number;
  status?: 'scheduled' | 'live' | 'finished';
  timeConfirmed?: boolean;
}
export interface SeedKnockoutMatch {
  n: number; stage: 'R32' | 'R16' | 'QF' | 'SF' | 'THIRD' | 'FINAL';
  date: string; localTime: string; venue: string;
  home: { type: 'GROUP_WINNER' | 'GROUP_RUNNERUP' | 'THIRD_POOL' | 'MATCH_WINNER' | 'MATCH_LOSER'; ref: string; label: string };
  away: { type: 'GROUP_WINNER' | 'GROUP_RUNNERUP' | 'THIRD_POOL' | 'MATCH_WINNER' | 'MATCH_LOSER'; ref: string; label: string };
  timeConfirmed?: boolean;
}

export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export const TEAMS: SeedTeam[] = [
  // Group A
  { code: 'MEX', name: 'Mexico', group: 'A' },
  { code: 'KOR', name: 'South Korea', group: 'A' },
  { code: 'RSA', name: 'South Africa', group: 'A' },
  { code: 'CZE', name: 'Czechia', group: 'A' },
  // Group B
  { code: 'CAN', name: 'Canada', group: 'B' },
  { code: 'SUI', name: 'Switzerland', group: 'B' },
  { code: 'QAT', name: 'Qatar', group: 'B' },
  { code: 'BIH', name: 'Bosnia and Herzegovina', group: 'B' },
  // Group C
  { code: 'BRA', name: 'Brazil', group: 'C' },
  { code: 'MAR', name: 'Morocco', group: 'C' },
  { code: 'SCO', name: 'Scotland', group: 'C' },
  { code: 'HAI', name: 'Haiti', group: 'C' },
  // Group D
  { code: 'USA', name: 'United States', group: 'D' },
  { code: 'PAR', name: 'Paraguay', group: 'D' },
  { code: 'AUS', name: 'Australia', group: 'D' },
  { code: 'TUR', name: 'Türkiye', group: 'D' },
  // Group E
  { code: 'GER', name: 'Germany', group: 'E' },
  { code: 'ECU', name: 'Ecuador', group: 'E' },
  { code: 'CIV', name: 'Ivory Coast', group: 'E' },
  { code: 'CUW', name: 'Curaçao', group: 'E' },
  // Group F
  { code: 'NED', name: 'Netherlands', group: 'F' },
  { code: 'JPN', name: 'Japan', group: 'F' },
  { code: 'SWE', name: 'Sweden', group: 'F' },
  { code: 'TUN', name: 'Tunisia', group: 'F' },
  // Group G
  { code: 'BEL', name: 'Belgium', group: 'G' },
  { code: 'IRN', name: 'Iran', group: 'G' },
  { code: 'EGY', name: 'Egypt', group: 'G' },
  { code: 'NZL', name: 'New Zealand', group: 'G' },
  // Group H
  { code: 'ESP', name: 'Spain', group: 'H' },
  { code: 'URU', name: 'Uruguay', group: 'H' },
  { code: 'KSA', name: 'Saudi Arabia', group: 'H' },
  { code: 'CPV', name: 'Cape Verde', group: 'H' },
  // Group I
  { code: 'FRA', name: 'France', group: 'I' },
  { code: 'SEN', name: 'Senegal', group: 'I' },
  { code: 'NOR', name: 'Norway', group: 'I' },
  { code: 'IRQ', name: 'Iraq', group: 'I' },
  // Group J
  { code: 'ARG', name: 'Argentina', group: 'J' },
  { code: 'AUT', name: 'Austria', group: 'J' },
  { code: 'ALG', name: 'Algeria', group: 'J' },
  { code: 'JOR', name: 'Jordan', group: 'J' },
  // Group K
  { code: 'POR', name: 'Portugal', group: 'K' },
  { code: 'COL', name: 'Colombia', group: 'K' },
  { code: 'UZB', name: 'Uzbekistan', group: 'K' },
  { code: 'COD', name: 'DR Congo', group: 'K' },
  // Group L
  { code: 'ENG', name: 'England', group: 'L' },
  { code: 'CRO', name: 'Croatia', group: 'L' },
  { code: 'GHA', name: 'Ghana', group: 'L' },
  { code: 'PAN', name: 'Panama', group: 'L' },
];

// UTC offsets are constant across the tournament window:
// US/Canada observe DST throughout; Mexico abolished DST (UTC-6 year-round).
export const VENUES: SeedVenue[] = [
  { key: 'AZT', name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', timezone: 'America/Mexico_City', utcOffsetMinutes: -360 },
  { key: 'AKR', name: 'Estadio Akron', city: 'Guadalajara', country: 'Mexico', timezone: 'America/Mexico_City', utcOffsetMinutes: -360 },
  { key: 'BBV', name: 'Estadio BBVA', city: 'Monterrey', country: 'Mexico', timezone: 'America/Monterrey', utcOffsetMinutes: -360 },
  { key: 'BMO', name: 'BMO Field', city: 'Toronto', country: 'Canada', timezone: 'America/Toronto', utcOffsetMinutes: -240 },
  { key: 'BCP', name: 'BC Place', city: 'Vancouver', country: 'Canada', timezone: 'America/Vancouver', utcOffsetMinutes: -420 },
  { key: 'SOF', name: 'SoFi Stadium', city: 'Los Angeles', country: 'USA', timezone: 'America/Los_Angeles', utcOffsetMinutes: -420 },
  { key: 'LEV', name: "Levi's Stadium", city: 'San Francisco Bay Area', country: 'USA', timezone: 'America/Los_Angeles', utcOffsetMinutes: -420 },
  { key: 'LUM', name: 'Lumen Field', city: 'Seattle', country: 'USA', timezone: 'America/Los_Angeles', utcOffsetMinutes: -420 },
  { key: 'GIL', name: 'Gillette Stadium', city: 'Boston', country: 'USA', timezone: 'America/New_York', utcOffsetMinutes: -240 },
  { key: 'MET', name: 'MetLife Stadium', city: 'New York / New Jersey', country: 'USA', timezone: 'America/New_York', utcOffsetMinutes: -240 },
  { key: 'LIN', name: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA', timezone: 'America/New_York', utcOffsetMinutes: -240 },
  { key: 'HRD', name: 'Hard Rock Stadium', city: 'Miami', country: 'USA', timezone: 'America/New_York', utcOffsetMinutes: -240 },
  { key: 'MBS', name: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA', timezone: 'America/New_York', utcOffsetMinutes: -240 },
  { key: 'ATT', name: 'AT&T Stadium', city: 'Dallas', country: 'USA', timezone: 'America/Chicago', utcOffsetMinutes: -300 },
  { key: 'NRG', name: 'NRG Stadium', city: 'Houston', country: 'USA', timezone: 'America/Chicago', utcOffsetMinutes: -300 },
  { key: 'ARR', name: 'GEHA Field at Arrowhead Stadium', city: 'Kansas City', country: 'USA', timezone: 'America/Chicago', utcOffsetMinutes: -300 },
];

export const GROUP_MATCHES: SeedGroupMatch[] = [
  // ── Matchday 1 ──
  { n: 1, group: 'A', date: '2026-06-11', localTime: '13:00', venue: 'AZT', home: 'MEX', away: 'RSA', homeScore: 2, awayScore: 0, status: 'finished' },
  { n: 2, group: 'A', date: '2026-06-11', localTime: '20:00', venue: 'AKR', home: 'KOR', away: 'CZE' },
  { n: 3, group: 'B', date: '2026-06-12', localTime: '15:00', venue: 'BMO', home: 'CAN', away: 'BIH' },
  { n: 4, group: 'D', date: '2026-06-12', localTime: '18:00', venue: 'SOF', home: 'USA', away: 'PAR' },
  { n: 5, group: 'C', date: '2026-06-13', localTime: '21:00', venue: 'GIL', home: 'HAI', away: 'SCO' },
  { n: 6, group: 'D', date: '2026-06-13', localTime: '21:00', venue: 'BCP', home: 'AUS', away: 'TUR' },
  { n: 7, group: 'C', date: '2026-06-13', localTime: '18:00', venue: 'MET', home: 'BRA', away: 'MAR' },
  { n: 8, group: 'B', date: '2026-06-13', localTime: '12:00', venue: 'LEV', home: 'QAT', away: 'SUI' },
  { n: 9, group: 'E', date: '2026-06-14', localTime: '19:00', venue: 'LIN', home: 'CIV', away: 'ECU' },
  { n: 10, group: 'E', date: '2026-06-14', localTime: '12:00', venue: 'NRG', home: 'GER', away: 'CUW' },
  { n: 11, group: 'F', date: '2026-06-14', localTime: '15:00', venue: 'ATT', home: 'NED', away: 'JPN' },
  { n: 12, group: 'F', date: '2026-06-14', localTime: '20:00', venue: 'BBV', home: 'SWE', away: 'TUN' },
  { n: 13, group: 'H', date: '2026-06-15', localTime: '18:00', venue: 'HRD', home: 'KSA', away: 'URU' },
  { n: 14, group: 'H', date: '2026-06-15', localTime: '12:00', venue: 'MBS', home: 'ESP', away: 'CPV' },
  { n: 15, group: 'G', date: '2026-06-15', localTime: '18:00', venue: 'SOF', home: 'IRN', away: 'NZL' },
  { n: 16, group: 'G', date: '2026-06-15', localTime: '12:00', venue: 'LUM', home: 'BEL', away: 'EGY' },
  { n: 17, group: 'I', date: '2026-06-16', localTime: '15:00', venue: 'MET', home: 'FRA', away: 'SEN' },
  { n: 18, group: 'I', date: '2026-06-16', localTime: '18:00', venue: 'GIL', home: 'IRQ', away: 'NOR' },
  { n: 19, group: 'J', date: '2026-06-16', localTime: '20:00', venue: 'ARR', home: 'ARG', away: 'ALG' },
  { n: 20, group: 'J', date: '2026-06-16', localTime: '21:00', venue: 'LEV', home: 'AUT', away: 'JOR' },
  { n: 21, group: 'L', date: '2026-06-17', localTime: '19:00', venue: 'BMO', home: 'GHA', away: 'PAN' },
  { n: 22, group: 'L', date: '2026-06-17', localTime: '15:00', venue: 'ATT', home: 'ENG', away: 'CRO' },
  { n: 23, group: 'K', date: '2026-06-17', localTime: '12:00', venue: 'NRG', home: 'POR', away: 'COD' },
  { n: 24, group: 'K', date: '2026-06-17', localTime: '20:00', venue: 'AZT', home: 'UZB', away: 'COL' },
  // ── Matchday 2 ──
  { n: 25, group: 'A', date: '2026-06-18', localTime: '12:00', venue: 'MBS', home: 'CZE', away: 'RSA' },
  { n: 26, group: 'B', date: '2026-06-18', localTime: '12:00', venue: 'SOF', home: 'SUI', away: 'BIH' },
  { n: 27, group: 'B', date: '2026-06-18', localTime: '15:00', venue: 'BCP', home: 'CAN', away: 'QAT' },
  { n: 28, group: 'A', date: '2026-06-18', localTime: '21:00', venue: 'AKR', home: 'MEX', away: 'KOR', timeConfirmed: false },
  { n: 29, group: 'C', date: '2026-06-19', localTime: '21:00', venue: 'LIN', home: 'BRA', away: 'HAI' },
  { n: 30, group: 'C', date: '2026-06-19', localTime: '18:00', venue: 'GIL', home: 'SCO', away: 'MAR' },
  { n: 31, group: 'D', date: '2026-06-19', localTime: '21:00', venue: 'LEV', home: 'PAR', away: 'TUR' },
  { n: 32, group: 'D', date: '2026-06-19', localTime: '12:00', venue: 'LUM', home: 'USA', away: 'AUS' },
  { n: 33, group: 'E', date: '2026-06-20', localTime: '16:00', venue: 'BMO', home: 'GER', away: 'CIV' },
  { n: 34, group: 'E', date: '2026-06-20', localTime: '19:00', venue: 'ARR', home: 'ECU', away: 'CUW' },
  { n: 35, group: 'F', date: '2026-06-20', localTime: '12:00', venue: 'NRG', home: 'NED', away: 'SWE' },
  { n: 36, group: 'F', date: '2026-06-20', localTime: '22:00', venue: 'BBV', home: 'TUN', away: 'JPN', timeConfirmed: false },
  { n: 37, group: 'H', date: '2026-06-21', localTime: '18:00', venue: 'HRD', home: 'URU', away: 'CPV' },
  { n: 38, group: 'H', date: '2026-06-21', localTime: '12:00', venue: 'MBS', home: 'ESP', away: 'KSA' },
  { n: 39, group: 'G', date: '2026-06-21', localTime: '12:00', venue: 'SOF', home: 'BEL', away: 'IRN' },
  { n: 40, group: 'G', date: '2026-06-21', localTime: '18:00', venue: 'BCP', home: 'NZL', away: 'EGY' },
  { n: 41, group: 'I', date: '2026-06-22', localTime: '20:00', venue: 'MET', home: 'NOR', away: 'SEN' },
  { n: 42, group: 'I', date: '2026-06-22', localTime: '17:00', venue: 'LIN', home: 'FRA', away: 'IRQ' },
  { n: 43, group: 'J', date: '2026-06-22', localTime: '12:00', venue: 'ATT', home: 'ARG', away: 'AUT' },
  { n: 44, group: 'J', date: '2026-06-22', localTime: '20:00', venue: 'LEV', home: 'JOR', away: 'ALG' },
  { n: 45, group: 'L', date: '2026-06-23', localTime: '16:00', venue: 'GIL', home: 'ENG', away: 'GHA' },
  { n: 46, group: 'L', date: '2026-06-23', localTime: '19:00', venue: 'BMO', home: 'PAN', away: 'CRO' },
  { n: 47, group: 'K', date: '2026-06-23', localTime: '12:00', venue: 'NRG', home: 'POR', away: 'UZB' },
  { n: 48, group: 'K', date: '2026-06-23', localTime: '20:00', venue: 'AKR', home: 'COL', away: 'COD' },
  // ── Matchday 3 (simultaneous kickoffs per group) ──
  { n: 49, group: 'C', date: '2026-06-24', localTime: '18:00', venue: 'HRD', home: 'SCO', away: 'BRA' },
  { n: 50, group: 'C', date: '2026-06-24', localTime: '18:00', venue: 'MBS', home: 'MAR', away: 'HAI' },
  { n: 51, group: 'B', date: '2026-06-24', localTime: '12:00', venue: 'BCP', home: 'SUI', away: 'CAN' },
  { n: 52, group: 'B', date: '2026-06-24', localTime: '12:00', venue: 'LUM', home: 'BIH', away: 'QAT' },
  { n: 53, group: 'A', date: '2026-06-24', localTime: '19:00', venue: 'AZT', home: 'CZE', away: 'MEX' },
  { n: 54, group: 'A', date: '2026-06-24', localTime: '19:00', venue: 'BBV', home: 'RSA', away: 'KOR' },
  { n: 55, group: 'E', date: '2026-06-25', localTime: '16:00', venue: 'LIN', home: 'CUW', away: 'CIV' },
  { n: 56, group: 'E', date: '2026-06-25', localTime: '16:00', venue: 'MET', home: 'ECU', away: 'GER' },
  { n: 57, group: 'F', date: '2026-06-25', localTime: '18:00', venue: 'ATT', home: 'JPN', away: 'SWE' },
  { n: 58, group: 'F', date: '2026-06-25', localTime: '18:00', venue: 'ARR', home: 'TUN', away: 'NED' },
  { n: 59, group: 'D', date: '2026-06-25', localTime: '19:00', venue: 'SOF', home: 'USA', away: 'TUR' },
  { n: 60, group: 'D', date: '2026-06-25', localTime: '19:00', venue: 'LEV', home: 'PAR', away: 'AUS' },
  { n: 61, group: 'I', date: '2026-06-26', localTime: '15:00', venue: 'GIL', home: 'NOR', away: 'FRA' },
  { n: 62, group: 'I', date: '2026-06-26', localTime: '15:00', venue: 'BMO', home: 'SEN', away: 'IRQ' },
  { n: 63, group: 'H', date: '2026-06-26', localTime: '19:00', venue: 'NRG', home: 'CPV', away: 'KSA' },
  { n: 64, group: 'H', date: '2026-06-26', localTime: '18:00', venue: 'AKR', home: 'URU', away: 'ESP' },
  { n: 65, group: 'G', date: '2026-06-26', localTime: '20:00', venue: 'LUM', home: 'EGY', away: 'IRN' },
  { n: 66, group: 'G', date: '2026-06-26', localTime: '20:00', venue: 'BCP', home: 'NZL', away: 'BEL' },
  { n: 67, group: 'L', date: '2026-06-27', localTime: '17:00', venue: 'MET', home: 'PAN', away: 'ENG' },
  { n: 68, group: 'L', date: '2026-06-27', localTime: '17:00', venue: 'LIN', home: 'CRO', away: 'GHA' },
  { n: 69, group: 'K', date: '2026-06-27', localTime: '19:30', venue: 'HRD', home: 'COL', away: 'POR' },
  { n: 70, group: 'K', date: '2026-06-27', localTime: '19:30', venue: 'MBS', home: 'COD', away: 'UZB' },
  { n: 71, group: 'J', date: '2026-06-27', localTime: '21:00', venue: 'ARR', home: 'ALG', away: 'AUT' },
  { n: 72, group: 'J', date: '2026-06-27', localTime: '21:00', venue: 'ATT', home: 'JOR', away: 'ARG' },
];

const W = (g: string) => ({ type: 'GROUP_WINNER' as const, ref: g, label: `Winner Group ${g}` });
const RU = (g: string) => ({ type: 'GROUP_RUNNERUP' as const, ref: g, label: `Runner-up Group ${g}` });
const T3 = (pool: string) => ({ type: 'THIRD_POOL' as const, ref: pool, label: `Third place Group ${pool.split(',').join('/')}` });
const WM = (m: number) => ({ type: 'MATCH_WINNER' as const, ref: String(m), label: `Winner Match ${m}` });
const LM = (m: number) => ({ type: 'MATCH_LOSER' as const, ref: String(m), label: `Loser Match ${m}` });

export const KNOCKOUT_MATCHES: SeedKnockoutMatch[] = [
  // ── Round of 32 (Jun 28 – Jul 3) ──
  { n: 73, stage: 'R32', date: '2026-06-28', localTime: '12:00', venue: 'SOF', home: RU('A'), away: RU('B') },
  { n: 74, stage: 'R32', date: '2026-06-29', localTime: '16:30', venue: 'GIL', home: W('E'), away: T3('A,B,C,D,F') },
  { n: 75, stage: 'R32', date: '2026-06-29', localTime: '19:00', venue: 'BBV', home: W('F'), away: RU('C') },
  { n: 76, stage: 'R32', date: '2026-06-29', localTime: '12:00', venue: 'NRG', home: W('C'), away: RU('F') },
  { n: 77, stage: 'R32', date: '2026-06-30', localTime: '17:00', venue: 'MET', home: W('I'), away: T3('C,D,F,G,H') },
  { n: 78, stage: 'R32', date: '2026-06-30', localTime: '12:00', venue: 'ATT', home: RU('E'), away: RU('I') },
  { n: 79, stage: 'R32', date: '2026-06-30', localTime: '19:00', venue: 'AZT', home: W('A'), away: T3('C,E,F,H,I') },
  { n: 80, stage: 'R32', date: '2026-07-01', localTime: '12:00', venue: 'MBS', home: W('L'), away: T3('E,H,I,J,K') },
  { n: 81, stage: 'R32', date: '2026-07-01', localTime: '17:00', venue: 'LEV', home: W('D'), away: T3('B,E,F,I,J') },
  { n: 82, stage: 'R32', date: '2026-07-01', localTime: '13:00', venue: 'LUM', home: W('G'), away: T3('A,E,H,I,J') },
  { n: 83, stage: 'R32', date: '2026-07-02', localTime: '19:00', venue: 'BMO', home: RU('K'), away: RU('L') },
  { n: 84, stage: 'R32', date: '2026-07-02', localTime: '12:00', venue: 'SOF', home: W('H'), away: RU('J') },
  { n: 85, stage: 'R32', date: '2026-07-02', localTime: '20:00', venue: 'BCP', home: W('B'), away: T3('E,F,G,I,J') },
  { n: 86, stage: 'R32', date: '2026-07-03', localTime: '18:00', venue: 'HRD', home: W('J'), away: RU('H') },
  { n: 87, stage: 'R32', date: '2026-07-03', localTime: '20:30', venue: 'ARR', home: W('K'), away: T3('D,E,I,J,L') },
  { n: 88, stage: 'R32', date: '2026-07-03', localTime: '13:00', venue: 'ATT', home: RU('D'), away: RU('G') },
  // ── Round of 16 (Jul 4 – 7) ──
  { n: 89, stage: 'R16', date: '2026-07-04', localTime: '17:00', venue: 'LIN', home: WM(74), away: WM(77) },
  { n: 90, stage: 'R16', date: '2026-07-04', localTime: '12:00', venue: 'NRG', home: WM(73), away: WM(75) },
  { n: 91, stage: 'R16', date: '2026-07-05', localTime: '16:00', venue: 'MET', home: WM(76), away: WM(78), timeConfirmed: false },
  { n: 92, stage: 'R16', date: '2026-07-05', localTime: '18:00', venue: 'AZT', home: WM(79), away: WM(80) },
  { n: 93, stage: 'R16', date: '2026-07-06', localTime: '14:00', venue: 'ATT', home: WM(83), away: WM(84) },
  { n: 94, stage: 'R16', date: '2026-07-06', localTime: '17:00', venue: 'LUM', home: WM(81), away: WM(82) },
  { n: 95, stage: 'R16', date: '2026-07-07', localTime: '12:00', venue: 'MBS', home: WM(86), away: WM(88) },
  { n: 96, stage: 'R16', date: '2026-07-07', localTime: '13:00', venue: 'BCP', home: WM(85), away: WM(87) },
  // ── Quarter-finals (Jul 9 – 11) ──
  { n: 97, stage: 'QF', date: '2026-07-09', localTime: '16:00', venue: 'GIL', home: WM(89), away: WM(90), timeConfirmed: false },
  { n: 98, stage: 'QF', date: '2026-07-10', localTime: '12:00', venue: 'SOF', home: WM(93), away: WM(94), timeConfirmed: false },
  { n: 99, stage: 'QF', date: '2026-07-11', localTime: '17:00', venue: 'HRD', home: WM(91), away: WM(92), timeConfirmed: false },
  { n: 100, stage: 'QF', date: '2026-07-11', localTime: '20:00', venue: 'ARR', home: WM(95), away: WM(96), timeConfirmed: false },
  // ── Semi-finals (Jul 14 – 15) ──
  { n: 101, stage: 'SF', date: '2026-07-14', localTime: '14:00', venue: 'ATT', home: WM(97), away: WM(98), timeConfirmed: false },
  { n: 102, stage: 'SF', date: '2026-07-15', localTime: '15:00', venue: 'MBS', home: WM(99), away: WM(100), timeConfirmed: false },
  // ── Third place (Jul 18, Miami) & Final (Jul 19, New York / New Jersey) ──
  { n: 103, stage: 'THIRD', date: '2026-07-18', localTime: '17:00', venue: 'HRD', home: LM(101), away: LM(102) },
  { n: 104, stage: 'FINAL', date: '2026-07-19', localTime: '15:00', venue: 'MET', home: WM(101), away: WM(102) },
];
