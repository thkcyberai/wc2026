/** @type {import('next').NextConfig} */

// Content-Security-Policy:
// - script/style allow 'unsafe-inline' (required by Next.js hydration) but
//   scripts may only load from our own origin — no third-party JS can run.
// - images: self + the two trusted CDNs (country flags, player photos).
// - connect-src 'self': the browser may only call our own API.
// - frame-ancestors 'none': nobody can embed the site (clickjacking).
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://flagcdn.com https://media.api-sports.io https://media-1.api-sports.io https://media-2.api-sports.io https://media-3.api-sports.io",
  "font-src 'self' data:",
  "connect-src 'self' ws: wss:", // ws for Next.js dev hot-reload; no third-party HTTP allowed
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];

const nextConfig = {
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
