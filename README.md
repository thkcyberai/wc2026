# ⚽ WC2026 Calendar Tracker

A local web app for following the **FIFA World Cup 2026** (USA · Canada · Mexico, June 11 – July 19, 2026): full 104-match calendar, live group tables, best-third qualification, and an auto-resolving knockout bracket — with match times shown in **venue local time, Lisboa, Colorado, and Brasil**.

Built with **Next.js 14 · React 18 · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · OpenAI (data normalization only)**.

The app ships pre-seeded with the real tournament: all 12 groups from the December 2025 Final Draw, all 104 fixtures with venues and kickoff times, and the official knockout bracket mapping (including FIFA's third-place pools per Round-of-32 match).

---

## 🚀 Quick start

```bash
cd C:\products\WC2026
npm install
npm run seed       # creates data/wc2026.db with the full tournament
npm run dev        # → http://localhost:3000
```

Open **http://localhost:3000** in your browser.

## 🔑 Adding your API keys

```bash
copy .env.example .env
```

Then edit `.env`:

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Normalizes fetched fixture data (team-name mapping like "Korea Republic" → "South Korea", venue/status standardization) and explains refresh errors in plain language. **Never used as a score source.** Server-side only — never sent to the browser. |
| `OPENAI_MODEL` | Optional, defaults to `gpt-4o-mini`. |
| `FOOTBALL_DATA_API_KEY` | Recommended. Free key from [football-data.org](https://www.football-data.org) — the primary official score source (FIFA World Cup, competition `2000`). Without it, refresh falls back to the public [openfootball](https://github.com/openfootball) dataset (best-effort). |
| `API_FOOTBALL_KEY` | Recommended. Free key from [dashboard.api-sports.io](https://dashboard.api-sports.io) (100 req/day) — enables the Players tab (48 squads × 26 players with photos), goalscorer/card events on match cards, and photos in the Top Scorers ranking. Without it, the scorer ranking falls back to football-data.org (names only). |

Restart `npm run dev` after editing `.env`.

## 🔄 Refreshing scores daily

Two equivalent ways — both fetch from the configured public source, validate the data, update SQLite, recalculate all group tables and best-thirds, and fill knockout placeholders:

1. **In the app** — click **🔄 Refresh Data** on the Dashboard or Settings tab. The last-updated timestamp is shown on the Dashboard, and a full history on Settings.
2. **From the terminal** — `npm run refresh`

To automate it daily on Windows, create a Task Scheduler job:

```bat
schtasks /create /tn "WC2026 Refresh" /tr "cmd /c cd /d C:\products\WC2026 && npm run refresh" /sc daily /st 23:30
```

## 📦 Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app at http://localhost:3000 |
| `npm run seed` | (Re)create the SQLite DB with the full official tournament structure. **Warning: resets any refreshed scores.** |
| `npm run refresh` | Fetch latest scores → update DB → recalc standings & bracket |
| `npm run build` / `npm start` | Production build / serve |
| `npm run verify` | Run the data-layer test harness (simulates the whole tournament and asserts standings, third-place allocation and bracket logic) |

## 🧭 Pages

| Tab | Content |
|---|---|
| **Today** | Today's matches, live scores, latest results, next up, quick actions, last-updated timestamp |
| **Groups** | All 12 group tables (Pos · P · W · D · L · GF · GA · GD · Pts · qualification status). Top 2 qualify + 8 best thirds. |
| **Calendar** | All 104 match cards grouped by day — match number, stage, teams, venue, city, country, score, status, and kickoff in venue / Lisboa (`Europe/Lisbon`) / Colorado (`America/Denver`) / Brasil (`America/Sao_Paulo`) time. Filters: team, group, venue, stage, date, country + free-text search. |
| **Knockout** | Full bracket — Round of 32 → Round of 16 → Quarter-finals → Semi-finals → Third place → Final. Placeholders like *Winner Group A* or *Third place Group C/E/F/H/I* are replaced automatically as results arrive. |
| **Players** | All 48 national squads (26 players each) with photos, shirt numbers and positions, grouped by GK/DEF/MID/ATT. First use: press "Load all 48 squads" (≈49 API-Football calls). |
| **Top Scorers** | Goal ranking (≥1 goal), most goals first, with player photo, name, flag, team and goal count. Sourced from match events; penalties count, own goals don't. |
| **Settings** | Data-source status, refresh button, refresh history log |

## 🗃️ Database (SQLite, `data/wc2026.db`)

| Table | Contents |
|---|---|
| `teams` | 48 teams (FIFA code, name, group) |
| `groups` | Groups A–L |
| `venues` | 16 stadiums with IANA timezone + fixed tournament UTC offset |
| `matches` | All 104 matches (UTC kickoff, scores, penalties, status, placeholders) |
| `standings` | Computed group tables incl. qualification status |
| `knockout_mapping` | Bracket source of each knockout slot (group winner / runner-up / third-pool / match winner / match loser) |
| `refresh_logs` | Timestamped history of every refresh |

## 🧠 How the logic works

- **Standings** — recomputed from finished matches: points → goal difference → goals for → head-to-head mini-table among tied teams.
- **Best thirds** — once all 12 groups finish, the 12 third-placed teams are ranked (points → GD → GF) and the top 8 qualify.
- **Third-place allocation** — each Round-of-32 slot has FIFA's allowed group pool (e.g. Match 79: `3rd of C/E/F/H/I`); qualified thirds are assigned by constraint-solving so every team lands in a permitted slot.
- **Bracket propagation** — winners/losers flow into later rounds automatically (penalty shootouts respected).
- **Refresh pipeline** — `football-data.org` (if key set) → `openfootball` fallback → validation (score ranges, status whitelist, name resolution with alias table + optional OpenAI mapping) → SQLite → recalc. Failures are logged and never corrupt existing data; finished matches are never downgraded.

## 🔐 Security notes

- **Secrets server-side only** — `OPENAI_API_KEY`, `FOOTBALL_DATA_API_KEY` and `API_FOOTBALL_KEY` are read exclusively in server code; nothing is exposed to the browser.
- **Security headers on every response** (`next.config.mjs`): Content-Security-Policy (scripts only from own origin; images only from self + the two trusted CDNs; `frame-ancestors 'none'` against clickjacking), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS, `poweredByHeader` disabled.
- **Rate limiting** (`src/middleware.ts`): per-IP sliding window on all `/api` routes — 120 reads/min, 5 writes/min — plus endpoint-level cooldowns (refresh: 1/min globally, squad load: 1/10 min).
- **CSRF protection**: state-changing requests are rejected when their `Origin` / `Sec-Fetch-Site` indicates another site.
- **Input validation**: all query parameters are length-capped and whitelisted (groups A–L, known stages/countries, ISO dates, FIFA trigrams); every SQL statement is parameterized — no string-built SQL anywhere.
- **Data validation on ingest**: integer score bounds, status whitelist, canonical team matching; finished matches can never be downgraded by bad source data.
- **Error hygiene**: API responses return generic messages; details go to the server log only.
- API failures degrade gracefully: the app keeps serving the last good local data.

## 🛠️ Troubleshooting

- **`better-sqlite3` install errors** — prebuilt Windows binaries cover Node 18/20/22; if your Node version is unusual, install the latest LTS from nodejs.org and re-run `npm install`.
- **"Database not seeded"** — run `npm run seed`.
- **Refresh says no external data** — add `FOOTBALL_DATA_API_KEY` to `.env` (free), or retry later.
- A `*` next to a kickoff time means the time is provisional (sources disagreed at build time); a refresh from football-data.org corrects it… scores and dates are unaffected.
