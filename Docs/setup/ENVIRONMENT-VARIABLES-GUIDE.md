# Finding and configuring environment variables

This project loads local secrets from **`.env.local`** (git-ignored). The **authoritative list of variables** the app understands is **`.env.example`**: copy it, rename to `.env.local`, then fill values. Some keys are only created by hosts (Neon, Vercel) or by you in third-party dashboards.

**Rules**

- Never commit `.env.local` or paste secrets into tickets, chat, or screenshots.
- After `vercel env pull`, you may see **extra** variables (e.g. OIDC tokens, duplicate Redis URLs). They are safe to leave if unused; `.env.example` still describes what the Next.js app expects.
- **`NEXT_PUBLIC_*`** values are exposed to the browser—only put non-secrets there.

---

## 1. Database (PostgreSQL / Neon)

| Variable | Where to find it |
|----------|------------------|
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | **Neon** (or your host): Project → **Connection details**. Use the **pooled** string for `DATABASE_URL` and **direct** for `DATABASE_URL_UNPOOLED` when Neon provides both. |
| `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, etc. | Often injected automatically when you connect Vercel ↔ Neon, or copy from the same connection UI. |
| `POSTGRES_*` | Common on **Vercel Postgres** or Neon+Vercel integration; same connection string, different names. |

Local WebSocket proxy mode (see `AGENTS.md`) may use a special localhost URL—only if you run the ws-proxy for local Neon driver testing.

---

## 2. Email (Brevo)

| Variable | Where to find it |
|----------|------------------|
| `BREVO_API_KEY` | [Brevo](https://app.brevo.com) → **Settings → SMTP & API → API Keys**. Use the **API key**, not SMTP password. |
| `FROM_EMAIL`, `FROM_NAME` | Must be a **verified sender** (Brevo → Senders & IP). |
| `ADMIN_EMAIL` | Your inbox for admin notifications. |
| `BREVO_WEBHOOK_SECRET` (optional) | You define this string and configure the same value on Brevo’s webhook for bounces. |

**Email Hub · synced inbox** (`/admin/email-hub/inbox`): separate OAuth clients from Calendar — use `EMAIL_HUB_GMAIL_CLIENT_ID` / `EMAIL_HUB_GMAIL_CLIENT_SECRET` (Gmail API; redirect `/api/admin/email-hub/mailbox/gmail/callback`) and `EMAIL_HUB_MICROSOFT_*` (Graph Mail; redirect `/api/admin/email-hub/mailbox/microsoft/callback`). Refresh tokens are encrypted with `SCHEDULING_TOKEN_ENCRYPTION_KEY` or `SESSION_SECRET` (same pattern as scheduling integrations). Optional Vercel cron: `/api/cron/email-hub-inbox-sync` with `CRON_SECRET`.

---

## 3. Session, crypto, cron

| Variable | How to set |
|----------|------------|
| `SESSION_SECRET` | **Required in production**: `openssl rand -base64 32` (or similar). Min length enforced at boot. |
| `TRACKING_SIGNATURE_SECRET` (optional) | Separate HMAC secret for email tracking tokens; if unset, code may fall back to `SESSION_SECRET`. Generate like `openssl rand -hex 32`. |
| `CRON_SECRET` | Random string (see `.env.example` length note). Must match `Authorization: Bearer <value>` for `/api/cron/*` on Vercel. |
| `SKIP_VERCEL_CRON_SECRET`, `VERCEL_CRONS_DISABLED` | Escape hatches documented in `.env.example`—prefer setting `CRON_SECRET` in production. |

---

## 4. OpenAI, Brave Search (optional)

| Variable | Where to find it |
|----------|------------------|
| `OPENAI_API_KEY` | [OpenAI Platform](https://platform.openai.com/api-keys) → API keys. |
| `OPENAI_*_MODEL` overrides | Optional; defaults described in `.env.example`. |
| `BRAVE_SEARCH_API_KEY` | [Brave Search API](https://brave.com/search/api/). |

---

## 5. GitHub

| Variable | Where to find it |
|----------|------------------|
| `GITHUB_TOKEN` | [GitHub → Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens). Scopes depend on what you automate (repo read for secrets digestion, etc.). |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers). Redirect URL must match your app (`/api/auth/github/callback`). |
| `DEVELOPMENT_UPDATES_GITHUB_TOKEN` | Same kind of PAT; used if the digest loaded from GitHub needs private-repo or Contents API access. |

---

## 6. Facebook / Meta (login, Content Studio, ads)

| Variable | Where to find it |
|----------|------------------|
| `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | [Meta for Developers](https://developers.facebook.com/apps/) → your app → **Settings → Basic**. More detail: `Docs/setup/FACEBOOK-APP-SETTINGS.md`. |
| `FACEBOOK_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID` | **Page** access token and Page ID for publishing—not the same as app secret. See Meta **Pages** / Graph API Explorer or long-lived token flow. |
| Paid Growth **Meta ads** vars (`META_SYSTEM_USER_ACCESS_TOKEN`, etc.) | `Docs/implementation/PAID-GROWTH-MODULE.md`. |

`META_APP_ID` / `META_APP_SECRET` in `.env.example` may mirror Facebook app credentials for Marketing API.

---

## 7. Google (OAuth login, Calendar, GA4, Ads tags)

| Variable | Where to find it |
|----------|------------------|
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **APIs & Services → Credentials → OAuth 2.0 Client ID** (Web application). Add authorized redirect URI: `https://YOUR_DOMAIN/api/auth/google/callback` and `http://localhost:3000/api/auth/google/callback`. |
| `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET` | Separate OAuth client if you use **Integrations → Google Calendar**; enable **Google Calendar API** on the project. Redirect: `.../api/admin/integrations/google-calendar/callback`. |
| `GA4_PROPERTY_ID` | **GA4 → Admin → Property settings** → **Property ID** (numeric, e.g. `123456789`). **Not** the `G-XXXXXXXX` measurement ID. |
| `GA4_CLIENT_EMAIL`, `GA4_PRIVATE_KEY` | Service account: Cloud Console → **IAM → Service accounts → Keys → JSON**. In GA4, add that service account email as **Viewer** on the property. Paste `client_email` and PEM `private_key` (escape newlines as `\n` in `.env` if on one line). |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GOOGLE_ADS_ID`, etc. | From **GA4** data stream and **Google Ads** conversion setup; safe as `NEXT_PUBLIC_*`. |

---

## 8. LinkedIn, X (Twitter), Content Studio

| Variable | Where to find it |
|----------|------------------|
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | [LinkedIn Developer Portal](https://www.linkedin.com/developers/) → your app. |
| `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_AUTHOR_URN` | From OAuth product flow or Developer portal; **author URN** looks like `urn:li:person:...` or `urn:li:organization:...`. |
| `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_OAUTH2_ACCESS_TOKEN` | [X Developer Portal / OAuth 2.0](https://developer.twitter.com/). |

Webhook / notify vars (`CONTENT_STUDIO_PUBLISH_WEBHOOK_*`, `CONTENT_STUDIO_BREVO_NOTIFY_TO`) are URLs and secrets you define or copy from your automation tool.

---

## 9. Zoom

| Variable | Where to find it |
|----------|------------------|
| `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` | [Zoom Marketplace](https://marketplace.zoom.us/) → **Build App → Server-to-Server OAuth**. See also `Docs/setup/ZOOM-SERVER-TO-SERVER-SETUP.md`. |

---

## 10. Stripe (optional)

| Variable | Where to find it |
|----------|------------------|
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → Secret key (`sk_test_` / `sk_live_`). |
| `STRIPE_WEBHOOK_SECRET` | Stripe → **Developers → Webhooks** → endpoint signing secret (`whsec_...`) for your deployed `/api/webhooks/stripe` URL. |

---

## 11. Twilio, booking link secret (optional)

| Variable | Where to find it |
|----------|------------------|
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | [Twilio Console](https://console.twilio.com/). |
| `TWILIO_FROM_NUMBER` or `TWILIO_MESSAGING_SERVICE_SID` | Twilio phone numbers or Messaging Service. |
| `REVENUE_OPS_BOOKING_LINK_SECRET` | Generate locally, e.g. `openssl rand -hex 32`. |

---

## 12. Redis / rate limits (Upstash)

| Variable | Where to find it |
|----------|------------------|
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | [Upstash Console](https://console.upstash.com/) → database → **REST API** tab. |

You may also see legacy `KV_*` or `REDIS_URL` after Vercel/Neon pulls—they often duplicate Upstash/Vercel KV; prefer matching `.env.example` names for this repo.

---

## 13. Push (VAPID)

| Variable | How to set |
|----------|------------|
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Run `npx web-push generate-vapid-keys` and paste both. |

---

## 14. Site URL and analytics tags

| Variable | How to set |
|----------|------------|
| `NEXT_PUBLIC_APP_URL` | Production **`https://...`** origin (no trailing path). Used for OG URLs, emails, scheduling links, Server Actions origins. |
| `NEXT_PUBLIC_BASE_URL` | Often localhost in dev; production should align with your canonical domain. |
| `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID` | From Google Tag Manager container and Meta Events Manager. |

---

## 15. Development updates digest (GitHub file)

| Variable | How to set |
|----------|------------|
| `DEVELOPMENT_UPDATES_RAW_URL` | Optional override: raw GitHub URL to `content/development-updates.md`. |
| `DEVELOPMENT_UPDATES_GITHUB_REF` | Branch name (default `main`). |
| `GITHUB_TOKEN` / `DEVELOPMENT_UPDATES_GITHUB_TOKEN` | If the repo or file needs auth. |

On Vercel, `VERCEL_GIT_REPO_OWNER` and `VERCEL_GIT_REPO_SLUG` are often set automatically to build a default raw URL.

---

## 16. Vercel CLI / deployment env push

| Variable | Where to find it |
|----------|------------------|
| `VERCEL_API_TOKEN` (or legacy `VERCEL_TOKEN`) | [Vercel → Account Settings → Tokens](https://vercel.com/account/tokens). |
| `VERCEL_PROJECT_ID` | Project → **Settings → General**. |
| `VERCEL_TEAM_ID` | Team **Settings** if the project is under a team. |

These support admin tooling that syncs env to Vercel—**store only in `.env.local`**, never in git.

**`vercel env pull`** downloads what exists in the Vercel project into `.env.local`. Variables you add only locally still need to be **added in Vercel → Project → Settings → Environment Variables** for Production/Preview if deployments should see them.

---

## 17. Scripts and seed (local only)

`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` are for **local scripts** (`scripts/create-admin.ts`, seed, etc.). Do not rely on these for production session auth; follow normal admin signup/OAuth.

---

## Quick verification

1. **Minimal run**: `DATABASE_URL`, `SESSION_SECRET` (production), and optionally `BREVO_*` / `OPENAI_*` depending on features you use.
2. Run `npm run check` and `npm run dev` (see `AGENTS.md` for DB/WebSocket local quirks).
3. For production deploy: mirror required keys in **Vercel environment variables** and redeploy.

For feature-specific depth, cross-check **`.env.example` comments** and linked docs (`PAID-GROWTH-MODULE.md`, `FACEBOOK-APP-SETTINGS.md`, `VERCEL-DEPLOYMENT.md`, `PRODUCTION-CHECKLIST.md`).
