# AGENTS.md

## Cursor Cloud specific instructions

### Application overview

This is a Next.js 16 full-stack portfolio/CMS application ("Ascendra Technologies") with React 19, Tailwind CSS, Drizzle ORM, and PostgreSQL (via `@neondatabase/serverless`). The dev server uses Turbopack by default.

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

The `NODE_TLS_REJECT_UNAUTHORIZED=0` is needed to accept the self-signed cert used by the local WebSocket proxy. The server runs on port 3000 with Turbopack.

### Key gotchas

- **`npm run lint`** runs ESLint via a flat config (`eslint.config.mjs`) using `eslint-config-next`. The codebase has pre-existing lint warnings/errors (e.g. unescaped entities, hooks called conditionally). These are not regressions.
- **`npm run check`** runs `tsc` for type checking. The output shows pre-existing type errors in test files (`@testing-library/jest-dom` matcher types) — these do not affect runtime.
- **`npm run dev:webpack`** also uses Turbopack in Next.js 16; the `--webpack` flag only applies to builds.
- **Chrome ephemeral connections** can claim port 3000 transiently. If the dev server starts on a different port, check logs for the actual port.
- **Schema management** uses `npm run db:push` which runs `drizzle-kit push` (uses `pg` driver directly, not Neon WebSocket). This works without the WebSocket proxy.
- **Optional services** (Brevo email, OpenAI, Stripe, GitHub OAuth) degrade gracefully — the app runs fine without their API keys.

### Standard commands

See `package.json` scripts and `README.md` for:
- `npm run dev` — dev server (Turbopack, port 3000)
- `npm run lint` — ESLint (flat config, `eslint-config-next`)
- `npm run check` — TypeScript type check
- `npm test` — Jest test suite (17 suites, 75 tests)
- `npm run db:push` — push Drizzle schema to PostgreSQL
- `npm run db:seed` — seed database
