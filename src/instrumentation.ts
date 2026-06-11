// Runs once when the Next.js server boots (instrumentationHook).
// In production (AUTO_REFRESH=true), refreshes scores automatically on a
// schedule so the public site stays current without anyone clicking a button.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.AUTO_REFRESH !== 'true') return;

  const intervalHours = Number(process.env.AUTO_REFRESH_HOURS || '6');
  const { getDb } = await import('./lib/db');
  const { runRefresh } = await import('./lib/refresh');

  const tick = async () => {
    try {
      const result = await runRefresh(getDb());
      console.log(`[auto-refresh] ${result.ok ? 'ok' : 'failed'} — ${result.message}`);
    } catch (err) {
      console.error('[auto-refresh] error:', err);
    }
  };

  // first run shortly after boot, then on the interval
  setTimeout(tick, 30_000);
  setInterval(tick, intervalHours * 60 * 60 * 1000);
  console.log(`[auto-refresh] enabled — every ${intervalHours}h`);
}
