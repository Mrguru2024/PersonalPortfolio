# Finding and configuring environment variables

This project loads local secrets from **`.env.local`** (git-ignored). The **authoritative list of variable names** is **`.env.example`**.

**Standard workflow**

1. Copy **`.env.example`** to **`.env.local`** in the project root (same folder as `package.json`).
2. Fill values locally. Use the sections below to find each value in the right dashboard.
3. For **Vercel**: add the same keys under **Project → Settings → Environment Variables** (Production / Preview / Development as needed), then redeploy. To download what Vercel has: `vercel env pull` (creates/overwrites local env—be careful not to commit it).

**Rules**

- Never commit `.env.local` or paste secrets into tickets, chat, or screenshots.
- After `vercel env pull`, you may see **extra** variables (OIDC, duplicate Redis URLs). Safe to leave if unused; this doc and `.env.example` describe what the Next.js app expects.
- **`NEXT_PUBLIC_*`** is exposed to the browser—only non-secrets there.

---

## 1. Database (PostgreSQL / Neon)

### Variables

| Variable | Role |
|----------|------|
| `DATABASE_URL` | Primary connection string (prefer **pooled** when Neon offers pool + direct). |
| `DATABASE_URL_UNPOOLED` | Direct connection (migrations, some tools). Optional if you only use one string. |
| `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, … | Sometimes set by Vercel↔Neon integration instead of a single URL. |
| `POSTGRES_*` | Vercel Postgres style names; map to the same database. |

### Step by step — Neon (browser)

1. Open [https://console.neon.tech](https://console.neon.tech) and sign in.
2. Open your **Project** (or create one).
3. In the left sidebar, click **Dashboard** or stay on the project home.
4. Find **Connection details** (or **Connect**): Neon shows connection strings.
5. Copy the **pooled** connection string (often labeled “Pooled” or uses a `-pooler` host)—paste into `DATABASE_URL`.
6. If Neon shows a separate **direct** connection string, paste into `DATABASE_URL_UNPOOLED` (recommended for `drizzle-kit` / some CLIs).
7. If you only see one URI, use it for `DATABASE_URL` and skip `DATABASE_URL_UNPOOLED` until you need it.

### Step by step — Vercel + Neon (integration)

1. Open [https://vercel.com](https://vercel.com) → your **Project**.
2. **Storage** (or **Integrations**) → add/link **Neon**.
3. After linking, Vercel may inject `DATABASE_URL` (and related vars) automatically—check **Project → Settings → Environment Variables** to see names and values.

Local WebSocket proxy mode for the Neon serverless driver is documented in **`AGENTS.md`** (optional; only for specific local setups).

---

## 2. Email (Brevo)

### Variables

| Variable | Role |
|----------|------|
| `BREVO_API_KEY` | REST API authentication. |
| `FROM_EMAIL`, `FROM_NAME` | Default sender; must be **verified** in Brevo. |
| `ADMIN_EMAIL` | Where admin notifications go (you choose the address). |
| `BREVO_WEBHOOK_SECRET` (optional) | A **string you invent**; same value must appear on the webhook URL/query in Brevo. |

### Step by step — Brevo API key

1. Open [https://app.brevo.com](https://app.brevo.com) and log in.
2. Click your **account menu** (top right) → **SMTP & API** (or go **Transational** → **Settings** depending on UI).
3. Open **API Keys** (or **SMTP & API** → **API keys**).
4. Click **Generate a new API key**, name it (e.g. `production-ascendra`), copy the key once—it may not show fully again.
5. Paste into `.env.local` as `BREVO_API_KEY=...` (no quotes unless your shell needs them).

### Step by step — Verified sender (`FROM_EMAIL` / `FROM_NAME`)

1. In Brevo: **Marketing** or **Campaigns** area → **Senders, domains & dedicated IPs** (wording may be **Senders & IP** or **Senders**).
2. Add and **verify** your domain or single sender email (DNS or confirmation email).
3. Use exactly that verified address for `FROM_EMAIL` and a display string for `FROM_NAME`.

### Step by step — Webhook secret (optional)

1. Invent a long random string (e.g. `openssl rand -hex 32`) → `BREVO_WEBHOOK_SECRET` in `.env.local`.
2. In Brevo: **Transactional** → **Settings** → **Webhooks** (or **Automations** / webhooks—location varies).
3. Create webhook URL pointing to your site: `https://YOUR_DOMAIN/api/webhooks/brevo?secret=YOUR_SAME_STRING` (match `.env.example` pattern).
4. Save; Brevo will call that URL for events you subscribe to.

---

## 2b. Email Hub — Gmail (`EMAIL_HUB_GMAIL_*`)

Use a **separate** Google Cloud OAuth client from `GOOGLE_CALENDAR_*` (different API/scopes).

**Redirect URIs (exact, including path)**

- Production: `https://YOUR_DOMAIN/api/admin/email-hub/mailbox/gmail/callback`
- Local: `http://localhost:3000/api/admin/email-hub/mailbox/gmail/callback`

### Step by step — Google Cloud

1. Open [https://console.cloud.google.com](https://console.cloud.google.com) and select a **Project** (create one if needed).
2. Left menu **≡** → **APIs & Services** → **Library**.
3. Search **Gmail API** → open it → **Enable**.
4. **APIs & Services** → **OAuth consent screen**:
   - Choose **External** (or Internal for Workspace-only).
   - Fill app name, support email, developer contact.
   - **Scopes**: later you can rely on the OAuth client request; for review you may add Gmail scopes (`gmail.readonly`, `gmail.send`, `gmail.modify`) if the console asks.
   - Add **Test users** if the app stays in **Testing** (your Google account email).
5. **APIs & Services** → **Credentials** → **+ Create credentials** → **OAuth client ID**.
6. Application type: **Web application** — name it (e.g. `Email Hub Gmail`).
7. **Authorized redirect URIs**: add both localhost and production URLs from the box above → **Create**.
8. Copy **Client ID** → `EMAIL_HUB_GMAIL_CLIENT_ID`.
9. Copy **Client secret** → `EMAIL_HUB_GMAIL_CLIENT_SECRET`.
10. Token encryption: set `SCHEDULING_TOKEN_ENCRYPTION_KEY` (preferred) or ensure `SESSION_SECRET` is 16+ chars (see §3).

Admin UI: **Email Hub → Inbox** → **Connect Gmail** (starts OAuth).

---

## 2c. Email Hub — Microsoft (`EMAIL_HUB_MICROSOFT_*`)

**Redirect URIs (exact)**

- Production: `https://YOUR_DOMAIN/api/admin/email-hub/mailbox/microsoft/callback`
- Local: `http://localhost:3000/api/admin/email-hub/mailbox/microsoft/callback`

### Step by step — Microsoft Entra (Azure AD) app registration

1. Open [https://entra.microsoft.com](https://entra.microsoft.com) (or [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID**).
2. **Identity** → **Applications** → **App registrations** → **New registration**.
3. **Name**: e.g. `Email Hub Inbox`.
4. **Supported account types**: **Accounts in any organizational directory (any Microsoft 365 tenant) and personal Microsoft accounts** (multitenant + personal), unless you only want one tenant.
5. **Redirect URI**: platform **Web**, URL = your **production** callback above (add localhost separately in next step) → **Register**.
6. Open the new app → **Authentication**:
   - Under **Web** → **Redirect URIs**, add **both** production and `http://localhost:3000/.../callback`.
   - Enable **Access tokens** and **ID tokens** if shown as options for implicit/hybrid (SPA not required for server-side code exchange).
7. **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated**:
   - `Mail.ReadWrite`
   - `Mail.Send`
   - `User.Read`
   - `offline_access` (under **OpenId permissions**)
   - **Grant admin consent** if your tenant requires it (personal accounts: consent on first sign-in).
8. **Certificates & secrets** → **New client secret** → description + expiry → **Add** → copy **Value** immediately (hidden later) → `EMAIL_HUB_MICROSOFT_CLIENT_SECRET`.
9. **Overview** page: copy **Application (client) ID** → `EMAIL_HUB_MICROSOFT_CLIENT_ID`.

Admin UI: **Email Hub → Inbox** → **Connect Microsoft**.

---

## 3. Session, crypto, cron

| Variable | How to set |
|----------|------------|
| `SESSION_SECRET` | **Production required.** Generate e.g. `openssl rand -base64 32` (Git Bash, WSL, or Windows OpenSSL). Or any 32+ random bytes encoded safely—see `.env.example` for minimum length. |
| `SCHEDULING_TOKEN_ENCRYPTION_KEY` | Long random string (preferred for encrypting OAuth refresh tokens: scheduling, Email Hub mailbox). |
| `TRACKING_SIGNATURE_SECRET` (optional) | `openssl rand -hex 32`; else code may use `SESSION_SECRET`. |
| `CRON_SECRET` | Long random string; Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` to `/api/cron/*`. |
| `SKIP_VERCEL_CRON_SECRET`, `VERCEL_CRONS_DISABLED` | Escape hatches in `.env.example`. |

### Step by step — Vercel `CRON_SECRET`

1. Generate a secret locally (32+ chars recommended; see `.env.example`).
2. **Vercel** → **Project** → **Settings** → **Environment Variables**.
3. Add `CRON_SECRET` for **Production** (and Preview if you test crons there).
4. Redeploy. Crons defined in `vercel.json` will include the Bearer header automatically when the secret is set on Vercel.

---

## 4. OpenAI, Brave Search (optional)

### OpenAI

1. Open [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. **Create new secret key** → copy → `OPENAI_API_KEY`.
3. Organization/billing: **Settings** / **Billing** on the same site if calls fail with quota errors.

### Brave Search API

1. Open [https://brave.com/search/api/](https://brave.com/search/api/) → sign up / dashboard.
2. Create a **subscription** and copy the **API key** → `BRAVE_SEARCH_API_KEY`.

---

## 5. GitHub

### Personal access token (`GITHUB_TOKEN`, `DEVELOPMENT_UPDATES_GITHUB_TOKEN`)

1. GitHub (logged in) → **profile photo** (top right) → **Settings**.
2. Left sidebar: **Developer settings** (bottom).
3. **Personal access tokens** → **Fine-grained tokens** or **Tokens (classic)** per your org policy.
4. **Generate**: select repos/scopes (e.g. **Contents read** for private markdown), generate, copy once.

### OAuth app (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`)

1. **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**.
2. **Homepage URL**: your site root. **Authorization callback URL**: `https://YOUR_DOMAIN/api/auth/github/callback` plus `http://localhost:3000/api/auth/github/callback` if dev uses OAuth.
3. After creation: **Client ID** and **Generate a new client secret** → map to env vars.

---

## 6. Facebook / Meta

Summary table plus **`Docs/setup/FACEBOOK-APP-SETTINGS.md`** for deep setup.

### App ID and App Secret

1. [https://developers.facebook.com/apps/](https://developers.facebook.com/apps/) → **Create app** or select existing.
2. App type depends on use (Consumer / Business). Complete wizard.
3. Left sidebar: **App settings** → **Basic**.
4. **App ID** → `FACEBOOK_APP_ID`. **App secret** → **Show** → `FACEBOOK_APP_SECRET`.

### Page access token & Page ID (Content Studio publishing)

Not the same as app secret. Typical path:

1. **Meta Business Suite** or **Graph API Explorer** (developers site **Tools**).
2. Get a **Page** access token with `pages_manage_posts` / relevant permissions.
3. Page ID: Page **About** / **Page info**, or from Graph API `me/accounts`.

Paid ads vars: **`Docs/implementation/PAID-GROWTH-MODULE.md`**.

---

## 7. Google (site login, Calendar, GA4 service account, public tags)

### OAuth Web Client (`GOOGLE_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_ID`, etc.)

1. [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials).
2. **+ Create credentials** → **OAuth client ID**. Type **Web application**.
3. **Authorized JavaScript origins**: `https://YOUR_DOMAIN`, `http://localhost:3000`.
4. **Authorized redirect URIs**: Must match **exactly** each flow:
   - Site login: `.../api/auth/google/callback`
   - Calendar integration: `.../api/admin/integrations/google-calendar/callback`
5. Enable the relevant **API** under **APIs & Services** → **Library** (e.g. **Google Calendar API** for scheduling).

### GA4 numeric Property ID (`GA4_PROPERTY_ID`)

1. [https://analytics.google.com](https://analytics.google.com) → **Admin** (gear, lower left).
2. **Property** column → **Property settings**.
3. Copy **Property ID** (digits only). Not the `G-XXXX` measurement ID.

### GA4 service account (`GA4_CLIENT_EMAIL`, `GA4_PRIVATE_KEY`)

1. Google Cloud → **IAM & Admin** → **Service accounts** → **Create service account** → **Keys** → **Add key** → **JSON** (downloads once).
2. Open JSON: `client_email` and `private_key` → paste into env (multi-line key: often `\n` in one line in `.env`).
3. GA4 **Admin** → **Property access management**: add the service account email with **Viewer**.

### Public measurement IDs (`NEXT_PUBLIC_*`)

- **GA4**: **Admin** → **Data streams** → select stream → **Measurement ID** (`G-...`).
- **Google Ads**: from Ads conversion / tag setup (varies by account).

---

## 8. LinkedIn, X (Twitter)

### LinkedIn app

1. [https://www.linkedin.com/developers/apps](https://www.linkedin.com/developers/apps) → **Create app**.
2. **Auth** tab: **Client ID**, **Primary Client Secret** → env vars.
3. **Redirect URLs**: must match your site’s OAuth callback route (see `.env.example` / integration docs).

### X (Twitter) Developer Portal

1. [https://developer.twitter.com/en/portal/dashboard](https://developer.twitter.com/en/portal/dashboard) → **Projects & Apps** → your app.
2. **Keys and tokens**: **Client ID**, **Client Secret** (OAuth 2) or API key/secret depending on flow.
3. **User authentication settings**: set callback URL to match this repo’s X OAuth callback path.

Webhook vars (`CONTENT_STUDIO_PUBLISH_WEBHOOK_*`, etc.) are **URLs and secrets you create** on your automation side (Make, Zapier, etc.).

---

## 9. Zoom

1. [https://marketplace.zoom.us/](https://marketplace.zoom.us/) → **Develop** → **Build App**.
2. **Server-to-Server OAuth** app type.
3. **App credentials** tab: **Account ID**, **Client ID**, **Client Secret** → env vars.
4. More detail: **`Docs/setup/ZOOM-SERVER-TO-SERVER-SETUP.md`**.

---

## 10. Stripe (optional)

1. [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) → **Secret key** (`sk_test_` / `sk_live_`) → `STRIPE_SECRET_KEY`. Toggle **Test mode** for sandbox.
2. **Developers** → **Webhooks** → **Add endpoint** → URL `https://YOUR_DOMAIN/api/webhooks/stripe` → after saving open the endpoint → **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`.

---

## 11. Twilio; booking link secret

1. [https://console.twilio.com](https://console.twilio.com) → **Account** dashboard: **Account SID**, **Auth Token** (`TWILIO_*`).
2. **Phone Numbers** or **Messaging** → **Services** for **Messaging Service SID** / **From** number.
3. `REVENUE_OPS_BOOKING_LINK_SECRET`: generate locally (`openssl rand -hex 32`).

---

## 12. Redis / Upstash

1. [https://console.upstash.com](https://console.upstash.com) → **Redis** → create database → **REST API** tab.
2. Copy **UPSTASH_REDIS_REST_URL** and **UPSTASH_REDIS_REST_TOKEN**.

---

## 13. Push (VAPID)

Terminal in project: `npx web-push generate-vapid-keys` → paste **public** and **private** into `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`.

---

## 14. Site URL and analytics tags

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_APP_URL` | Production `https://domain.com` (no trailing slash). |
| `NEXT_PUBLIC_BASE_URL` | Often aligned with canonical site URL. |
| `NEXT_PUBLIC_GTM_ID` | [tagmanager.google.com](https://tagmanager.google.com) → container **GTM-xxxx**. |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta **Events Manager** → **Data sources** → Pixel ID. |

---

## 15. Development updates digest

| Variable | Notes |
|----------|--------|
| `DEVELOPMENT_UPDATES_RAW_URL` | Optional full raw URL to `content/development-updates.md`. |
| `DEVELOPMENT_UPDATES_GITHUB_REF` | Branch (default `main`). |
| `GITHUB_TOKEN` / `DEVELOPMENT_UPDATES_GITHUB_TOKEN` | PAT if repo or file is private. |

Vercel often sets `VERCEL_GIT_REPO_OWNER` and `VERCEL_GIT_REPO_SLUG` automatically to build a default raw GitHub URL.

---

## 16. Vercel CLI / deployment env

### API token

1. [https://vercel.com/account/tokens](https://vercel.com/account/tokens) → **Create** → copy → `VERCEL_API_TOKEN` (or legacy name in `.env.example`).

### Project / team IDs

1. **Vercel** → your **Project** → **Settings** → **General** → **Project ID** → `VERCEL_PROJECT_ID`.
2. Team: **Team Settings** → **General** → **Team ID** → `VERCEL_TEAM_ID` if applicable.

**`vercel env pull`**: downloads Vercel-stored env into `.env.local`. New keys must still be added in the Vercel UI (or CLI) for deployments to see them.

---

## 17. Scripts and seed (local only)

`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SEED_*` support **local** scripts—they are not the same as production auth. See script headers in `scripts/`.

---

## Quick verification

1. Minimum: `DATABASE_URL`, `SESSION_SECRET` (production), plus whatever features need (e.g. `BREVO_API_KEY`, `OPENAI_API_KEY`).
2. Run `npm run check` and `npm run dev` (see **`AGENTS.md`** for DB / WebSocket local notes).
3. Production: set the same keys in **Vercel → Environment Variables** and redeploy.

For feature depth, use **`.env.example` comments** and **`FACEBOOK-APP-SETTINGS.md`**, **`PAID-GROWTH-MODULE.md`**, **`VERCEL-DEPLOYMENT.md`**, **`PRODUCTION-CHECKLIST.md`** where linked.
