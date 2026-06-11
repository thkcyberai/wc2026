// Timezone helpers. Matches are stored as UTC ISO strings; display times are
// derived with Intl using IANA timezones (DST handled automatically).

export const DISPLAY_ZONES = {
  lisboa: 'Europe/Lisbon',
  colorado: 'America/Denver',
  brasil: 'America/Sao_Paulo',
} as const;

/** Convert a venue-local date+time into a UTC ISO string using a fixed offset. */
export function localToUtcIso(date: string, time: string, utcOffsetMinutes: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const utcMs = Date.UTC(y, m - 1, d, hh, mm) - utcOffsetMinutes * 60_000;
  return new Date(utcMs).toISOString();
}

export function formatInZone(utcIso: string, timeZone: string, withDate = false): string {
  const dt = new Date(utcIso);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(dt);
  if (!withDate) return time;
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone, weekday: 'short', day: '2-digit', month: 'short',
  }).format(dt);
  return `${date} ${time}`;
}

/** Day shift indicator vs the venue date, e.g. Lisboa often shows "+1". */
export function dayShift(utcIso: string, timeZone: string, venueTimeZone: string): string {
  const fmt = (tz: string) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
      .format(new Date(utcIso));
  const a = fmt(timeZone);
  const b = fmt(venueTimeZone);
  if (a === b) return '';
  return a > b ? ' (+1)' : ' (-1)';
}

export function dateInZone(utcIso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(utcIso));
}

export function prettyDate(utcIso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(utcIso));
}
