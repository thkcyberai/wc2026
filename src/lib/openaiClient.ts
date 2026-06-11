// OpenAI helper — SERVER-SIDE ONLY. Never import from client components.
// Role: parse/clean/normalize externally fetched fixture data and explain
// errors. It is NEVER used as the source of truth for scores.

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function apiKey(): string | null {
  return process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-key-here'
    ? process.env.OPENAI_API_KEY
    : null;
}

export function openAiAvailable(): boolean {
  return apiKey() !== null;
}

async function chat(system: string, user: string, jsonMode = true): Promise<string | null> {
  const key = apiKey();
  if (!key) return null;
  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      console.error(`[openai] HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return null;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error('[openai] request failed:', err);
    return null;
  }
}

export interface NormalizedFixture {
  match_number: number | null;
  home: string;
  away: string;
  home_score: number | null;
  away_score: number | null;
  status: 'scheduled' | 'live' | 'finished';
}

/**
 * Normalize raw fixture text/JSON from an external source into structured rows.
 * Team names are mapped onto the provided canonical list.
 */
export async function normalizeFixtures(
  raw: string,
  canonicalTeams: string[]
): Promise<NormalizedFixture[] | null> {
  const out = await chat(
    `You normalize football fixture data for the FIFA World Cup 2026.
Map every team name onto EXACTLY one of these canonical names: ${canonicalTeams.join('; ')}.
Standardize status to one of: scheduled, live, finished (IN_PLAY/PAUSED→live, FINISHED/AET/PEN→finished, TIMED/SCHEDULED/POSTPONED→scheduled).
Return JSON: {"fixtures":[{"match_number":int|null,"home":string,"away":string,"home_score":int|null,"away_score":int|null,"status":string}]}.
Only include rows where both teams map onto canonical names. Never invent scores.`,
    raw.slice(0, 60_000)
  );
  if (!out) return null;
  try {
    const parsed = JSON.parse(out) as { fixtures?: NormalizedFixture[] };
    if (!Array.isArray(parsed.fixtures)) return null;
    return parsed.fixtures.filter(
      (f) =>
        typeof f.home === 'string' &&
        typeof f.away === 'string' &&
        ['scheduled', 'live', 'finished'].includes(f.status)
    );
  } catch {
    return null;
  }
}

/** Map ambiguous team names onto canonical names (e.g. "Korea Republic" → "South Korea"). */
export async function mapTeamNames(
  unknownNames: string[],
  canonicalTeams: string[]
): Promise<Record<string, string | null> | null> {
  if (!unknownNames.length) return {};
  const out = await chat(
    `Map each input football team name onto exactly one canonical FIFA World Cup 2026 team name from this list, or null if it is not one of them: ${canonicalTeams.join('; ')}.
Return JSON: {"mapping":{"<input>":"<canonical or null>"}}`,
    JSON.stringify(unknownNames)
  );
  if (!out) return null;
  try {
    return (JSON.parse(out) as { mapping?: Record<string, string | null> }).mapping ?? null;
  } catch {
    return null;
  }
}

/** Standardize a venue name onto one of the 16 official stadiums (or null). */
export async function standardizeVenue(
  venueText: string,
  canonicalVenues: string[]
): Promise<string | null> {
  const out = await chat(
    `Map the input venue description onto exactly one of these FIFA World Cup 2026 stadiums, or null: ${canonicalVenues.join('; ')}.
Return JSON: {"venue": "<canonical or null>"}`,
    venueText
  );
  if (!out) return null;
  try {
    return (JSON.parse(out) as { venue?: string | null }).venue ?? null;
  } catch {
    return null;
  }
}

/** Explain a technical refresh error in one or two friendly sentences. */
export async function explainError(technicalMessage: string): Promise<string | null> {
  const out = await chat(
    'You explain technical errors from a World Cup score-refresh tool to a non-technical user in 1-2 short, friendly sentences. Include one practical suggestion. Respond with JSON: {"explanation": "..."}',
    technicalMessage.slice(0, 2_000)
  );
  if (!out) return null;
  try {
    return (JSON.parse(out) as { explanation?: string }).explanation ?? null;
  } catch {
    return null;
  }
}
