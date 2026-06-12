// API-Football (api-sports.io) client — squads, player photos, match events.
// Free tier: 100 requests/day. We budget calls per run via AF_MAX_CALLS.
// Server-side only.

const BASE = 'https://v3.football.api-sports.io';
const WORLD_CUP_LEAGUE_ID = 1;
const SEASON = 2026;

let callsThisRun = 0;
export function resetCallBudget() {
  callsThisRun = 0;
}
function maxCalls(): number {
  return Number(process.env.AF_MAX_CALLS || '80');
}

export function apiFootballAvailable(): boolean {
  return Boolean(process.env.API_FOOTBALL_KEY);
}

async function afGet<T>(path: string): Promise<T[]> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error('API_FOOTBALL_KEY not configured');
  if (callsThisRun >= maxCalls()) throw new Error('API-Football call budget reached for this run');
  callsThisRun++;
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'x-apisports-key': key },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`API-Football HTTP ${res.status}`);
  const data = (await res.json()) as { response?: T[]; errors?: unknown };
  if (!Array.isArray(data.response)) {
    throw new Error(`API-Football unexpected payload: ${JSON.stringify(data.errors ?? {}).slice(0, 200)}`);
  }
  return data.response;
}

export interface AfTeam {
  team: { id: number; name: string; code: string | null };
}
export function fetchTournamentTeams(): Promise<AfTeam[]> {
  return afGet<AfTeam>(`/teams?league=${WORLD_CUP_LEAGUE_ID}&season=${SEASON}`);
}

export interface AfSquad {
  team: { id: number; name: string };
  players: { id: number; name: string; number: number | null; position: string | null; photo: string | null }[];
}
export function fetchSquad(afTeamId: number): Promise<AfSquad[]> {
  return afGet<AfSquad>(`/players/squads?team=${afTeamId}`);
}

export interface AfFixture {
  fixture: { id: number; date: string; status: { short: string } };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
}
export function fetchFixtures(): Promise<AfFixture[]> {
  return afGet<AfFixture>(`/fixtures?league=${WORLD_CUP_LEAGUE_ID}&season=${SEASON}`);
}

export interface AfEvent {
  time: { elapsed: number | null; extra: number | null };
  team: { id: number; name: string };
  player: { id: number | null; name: string | null };
  type: string;   // 'Goal' | 'Card' | 'subst' | 'Var'
  detail: string; // 'Normal Goal' | 'Own Goal' | 'Penalty' | 'Yellow Card' | 'Red Card' | ...
}
export function fetchFixtureEvents(afFixtureId: number): Promise<AfEvent[]> {
  return afGet<AfEvent>(`/fixtures/events?fixture=${afFixtureId}`);
}

/** Map an API-Football event onto our event types (null = ignore, e.g. substitutions). */
export function mapEventType(ev: AfEvent): 'goal' | 'own-goal' | 'penalty' | 'yellow' | 'red' | null {
  if (ev.type === 'Goal') {
    if (/own goal/i.test(ev.detail)) return 'own-goal';
    if (/penalty/i.test(ev.detail) && !/missed/i.test(ev.detail)) return 'penalty';
    if (/missed/i.test(ev.detail)) return null;
    return 'goal';
  }
  if (ev.type === 'Card') {
    if (/yellow/i.test(ev.detail)) return 'yellow';
    if (/red/i.test(ev.detail)) return 'red';
  }
  return null;
}
