# AGENTS.md

## Cursor Cloud specific instructions

### Application overview

This is a Next.js 16 full-stack portfolio/CMS application ("Ascendra Technologies") with React 19, Tailwind CSS, Drizzle ORM, and PostgreSQL (via `@neondatabase/serverless`). **Next.js 16 defaults `next dev` to Turbopack**; this repo runs **`next dev --webpack`** via **`npm run dev`** to avoid Turbopack HMR bugs (e.g. “module factory is not available”). Use **`npm run dev:turbo`** for Turbopack.

### Local database setup

The app uses `@neondatabase/serverless` which connects to PostgreSQL via WebSocket. For local development, three components are needed:

1. **PostgreSQL** must be running locally with `password` auth mode (not `scram-sha-256`) for host connections in `pg_hba.conf`. This is required because the Neon driver's pipelined auth expects cleartext password exchange.

2. **WebSocket proxy** (`scripts/ws-proxy.mjs`) bridges WebSocket connections to local PostgreSQL TCP. Run it with sudo on port 443:
   ```
   sudo $(which node) scripts/ws-proxy.mjs
   ```
   Requires self-signed TLS certs at `/tmp/ws-proxy-key.pem` and `/tmp/ws-proxy-cert.pem`. Generate with:
   ```
   openssl req -x509 -newkey rsa:2048 -keyout /tmp/ws-proxy-key.pem -out /tmp/ws-proxy-cert.pem -days 365 -nodes -subj "/CN=localhost"
   ```

3. **`instrumentation.ts`** (in project root) configures `neonConfig` for local mode when `DATABASE_URL` points to localhost. This file is auto-detected by Next.js.

### Running the dev server

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev
```

The `NODE_TLS_REJECT_UNAUTHORIZED=0` is needed to accept the self-signed cert used by the local WebSocket proxy. The server runs on port 3000 (`npm run dev` uses Webpack via `--webpack`; `npm run dev:turbo` uses Turbopack).

### Key gotchas

- **`npm run lint`** is broken in this codebase: `next lint` was removed in Next.js 16. Use `npm run check` (`tsc`) for type checking instead. The `tsc` output shows pre-existing type errors in test files (`@testing-library/jest-dom` matcher types) — these do not affect runtime.
- **`npm run build`** and **`npm run dev`** use **`--webpack`** explicitly (Next 16’s default dev bundler is otherwise Turbopack). **`npm run dev:turbo`** uses `--turbo` / Turbopack.
- **Chrome ephemeral connections** can claim port 3000 transiently. If the dev server starts on a different port, check logs for the actual port.
- **Schema management** uses `npm run db:push` which runs `drizzle-kit push` (uses `pg` driver directly, not Neon WebSocket). This works without the WebSocket proxy.
- **Optional services** (Brevo email, OpenAI, Stripe, GitHub OAuth) degrade gracefully — the app runs fine without their API keys.
- **Vercel crons** (`vercel.json`): `/api/cron/growth-os` (daily) and `/api/cron/content-studio-publish` (every 10 minutes) for Content Studio scheduled social posts. Both require `CRON_SECRET` in production. Facebook Page publishing uses `FACEBOOK_ACCESS_TOKEN` + `FACEBOOK_PAGE_ID` (see `.env.example`).

### Site map (admin + AI agents)

- **Source of truth:** `app/lib/siteDirectory.ts` — paths, titles, categories, keywords, **cluster** (IA / consolidation hints), related routes.
- **Admin UI:** `/admin/site-directory` — search, audience filter, consolidation clusters, **Copy JSON for AI**.
- **API:** `GET /api/admin/site-directory` (approved admin session). Optional query `?q=crm` returns filtered `entries` plus `clusters`. Use for agents that can call authenticated APIs.

### Development updates (admin dashboard digest)

- Production loads `content/development-updates.md` from GitHub. **Branch defaults to `main`** (`DEVELOPMENT_UPDATES_GITHUB_REF`).
- **URL resolution:** set `DEVELOPMENT_UPDATES_RAW_URL` explicitly, or rely on Vercel’s `VERCEL_GIT_REPO_OWNER` + `VERCEL_GIT_REPO_SLUG` to build the raw URL (no paste needed for standard GitHub deploys). Private repos need `DEVELOPMENT_UPDATES_GITHUB_TOKEN` or `GITHUB_TOKEN` for the Contents API fallback.
- **Process:** when merging meaningful product changes to `main`, add a dated `## YYYY-MM-DD — Title` section to `content/development-updates.md` in the same commit or PR when practical so the digest stays truthful. Local dev reads the file from disk.

### Standard commands

See `package.json` scripts and `README.md` for:
- `npm run dev` — dev server (`next dev --webpack`, port 3000); `npm run dev:turbo` — Turbopack
- `npm run check` — TypeScript type check
- `npm test` — Jest test suite (17 suites, 75 tests)
- `npm run db:push` — push Drizzle schema to PostgreSQL
- `npm run db:seed` — seed database
