# 🌍 Deploying WC2026 Calendar Tracker to wc2026tracker.space

Three stages: push the code to GitHub → deploy on Railway → buy the domain and point it at Railway. About 30 minutes total.

---

## 1. Push the project to GitHub

In Git Bash:

```bash
cd /c/products/WC2026
git init
git add .
git commit -m "WC2026 Calendar Tracker"
```

Create a new **private or public** repository at https://github.com/new (name: `wc2026`), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/wc2026.git
git branch -M main
git push -u origin main
```

> `.gitignore` already excludes `.env` and `data/*.db` — your API keys and local scores never leave your machine.

## 2. Deploy on Railway

1. Go to https://railway.app → sign in with GitHub (Hobby plan, ~$5/mo).
2. **New Project → Deploy from GitHub repo** → pick `wc2026`. Railway auto-detects Next.js and builds it.
3. **Add a persistent volume** (this is what keeps SQLite data across deploys):
   - Click the service → **Settings → Volumes → Add Volume**
   - Mount path: `/data`
4. **Set environment variables** (service → **Variables**):

   | Variable | Value |
   |---|---|
   | `WC2026_DB_PATH` | `/data/wc2026.db` |
   | `AUTO_REFRESH` | `true` |
   | `AUTO_REFRESH_HOURS` | `6` (scores refresh themselves 4×/day) |
   | `FOOTBALL_DATA_API_KEY` | your football-data.org key |
   | `OPENAI_API_KEY` | your OpenAI key |

5. Redeploy if prompted. On first boot the app **auto-seeds** the full tournament into the empty volume (check the deploy logs for `[db] empty database detected — seeded`). It never reseeds an existing DB, so scores survive every future deploy.
6. **Settings → Networking → Generate Domain** — you'll get something like `wc2026-production.up.railway.app`. Open it and confirm the app works on the internet.

To ship future changes: just `git push` — Railway redeploys automatically.

## 3. Connect wc2026tracker.space (already purchased ✓)

1. In Railway: service → **Settings → Networking → Custom Domain** → enter both:
   - `wc2026tracker.space`
   - `www.wc2026tracker.space`
   Railway shows you the DNS records to create (a `CNAME` value per domain).
2. In the DNS panel of the registrar where you bought wc2026tracker.space, add what Railway showed, typically:

   | Type | Name | Value |
   |---|---|---|
   | CNAME | `www` | `<your-app>.up.railway.app` |
   | CNAME (or ALIAS/ANAME) | `@` | `<your-app>.up.railway.app` |

   > On Cloudflare, CNAME on the root (`@`) works directly (CNAME flattening). On Namecheap, use the "ALIAS" record type for `@`. If your registrar supports neither on the root, point `www` via CNAME and add a redirect from the root to `www`.
3. Wait for DNS to propagate (minutes up to a few hours). Railway provisions the HTTPS certificate automatically — no extra setup.

**Done:** https://wc2026tracker.space is live, refreshes scores automatically every 6 hours, and visitors can also press Refresh (rate-limited to once per minute).

---

## Production behaviors already built in

- **Auto-seed on first boot** — empty volume → full tournament loaded; existing DB → untouched.
- **Auto-refresh** — server refreshes scores every `AUTO_REFRESH_HOURS` hours (logged in `refresh_logs`, visible in the Settings tab).
- **Refresh rate-limit** — public `POST /api/refresh` accepts at most 1 request/minute, protecting your API quotas.
- **Secrets stay server-side** — `OPENAI_API_KEY` / `FOOTBALL_DATA_API_KEY` are only read in server code.

## Why this domain

`wc2026tracker.space` avoids FIFA's registered trademarks ("World Cup", "FIFA World Cup 2026"), which FIFA enforces against domains via UDRP complaints. The abbreviation keeps the project clearly identifiable while staying low-risk. (Not legal advice — for commercial use, ask a trademark lawyer.)
