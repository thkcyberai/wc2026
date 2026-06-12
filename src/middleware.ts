// Edge middleware — first line of defense for all /api routes.
//  1. Per-IP rate limiting (in-memory sliding window)
//  2. Same-origin enforcement on state-changing requests (CSRF protection)
// Purely additive: normal browser usage of the app is never affected.

import { NextRequest, NextResponse } from 'next/server';

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
// generous read limit; tight limit for endpoints that consume API quotas
const READ_LIMIT = 120;   // GET /api/* per IP per minute
const ACTION_LIMIT = 5;   // POST /api/* per IP per minute

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function rateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  // opportunistic cleanup so the map can't grow unbounded
  if (buckets.size > 5_000) {
    buckets.forEach((b, k) => { if (b.resetAt < now) buckets.delete(k); });
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  bucket.count++;
  return bucket.count <= limit;
}

export function middleware(req: NextRequest) {
  const isAction = req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS';

  // ── CSRF: state-changing requests must come from our own origin ──
  if (isAction) {
    const origin = req.headers.get('origin');
    if (origin) {
      let originHost: string | null = null;
      try { originHost = new URL(origin).host; } catch { originHost = null; }
      const requestHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
      if (!originHost || !requestHost || originHost !== requestHost) {
        return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
      }
    }
    // Sec-Fetch-Site (sent by all modern browsers): block explicit cross-site
    const fetchSite = req.headers.get('sec-fetch-site');
    if (fetchSite === 'cross-site') {
      return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 });
    }
  }

  // ── Rate limiting per IP ──
  const ip = clientIp(req);
  const limit = isAction ? ACTION_LIMIT : READ_LIMIT;
  const key = `${ip}:${isAction ? 'w' : 'r'}`;
  if (!rateLimit(key, limit)) {
    return NextResponse.json(
      { error: 'Too many requests — please slow down.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
