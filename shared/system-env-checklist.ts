/**
 * Env keys checked on GET /api/admin/system/health + explained on /admin/system.
 * Single source: health route derives key list from this array.
 */

export type SystemEnvTier = "essential" | "recommended" | "optional";

export interface SystemEnvChecklistEntry {
  key: string;
  tier: SystemEnvTier;
  /** What the app uses it for (one line). */
  summary: string;
  /** Where to create or copy the value. */
  howToGet: string;
}

export const SYSTEM_ENV_CHECKLIST: readonly SystemEnvChecklistEntry[] = [
  {
    key: "DATABASE_URL",
    tier: "essential",
    summary: "PostgreSQL connection string; required for all persisted data.",
    howToGet:
      "Neon/Supabase/Vercel Postgres dashboard → copy pooled connection string (see .env.example). Local: run Postgres and paste postgresql://…",
  },
  {
    key: "SESSION_SECRET",
    tier: "essential",
    summary: "Signs session cookies; production refuses to boot if missing/weak.",
    howToGet: "Terminal: openssl rand -base64 32 — paste into Vercel/host env (32+ chars).",
  },
  {
    key: "ADMIN_EMAIL",
    tier: "essential",
    summary: "Default recipient for alerts and several admin flows.",
    howToGet: "Your real inbox address (same as in .env.example); set in Vercel → Environment Variables.",
  },
  {
    key: "BREVO_API_KEY",
    tier: "essential",
    summary: "Sends transactional email (forms, password reset, newsletters) via Brevo API.",
    howToGet: "Brevo → Settings → SMTP & API → API keys → create key; not your SMTP password.",
  },
  {
    key: "STRIPE_SECRET_KEY",
    tier: "recommended",
    summary: "Stripe billing: invoices, customer portal, challenge/checkout flows that use Stripe.",
    howToGet: "Stripe Dashboard → Developers → API keys → Secret key (sk_test_… or sk_live_…). Skip if you do not use Stripe yet.",
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    tier: "essential",
    summary: "Public site URL for OAuth redirects, emails, canonical links (must match production domain).",
    howToGet: "e.g. https://yoursite.com — no trailing slash issues in most routes; set in Vercel for Production + Preview as needed.",
  },
  {
    key: "TRACKING_SIGNATURE_SECRET",
    tier: "essential",
    summary: "HMAC for email open/click tracking tokens; production expects a strong secret.",
    howToGet: "openssl rand -hex 32 — or rely on SESSION_SECRET only if your security policy allows (see .env.example notes).",
  },
  {
    key: "NEXT_PUBLIC_BASE_URL",
    tier: "optional",
    summary: "Fallback public URL in some email/link helpers when NEXT_PUBLIC_APP_URL is unset.",
    howToGet: "Usually same as NEXT_PUBLIC_APP_URL or localhost for dev; optional if NEXT_PUBLIC_APP_URL is set.",
  },
  {
    key: "CRON_SECRET",
    tier: "recommended",
    summary: "Bearer token Vercel Cron sends to /api/cron/*; required on Vercel prod if crons are enabled.",
    howToGet: "openssl rand -hex 24 — add CRON_SECRET in Vercel env. Or remove crons / use SKIP_VERCEL_CRON_SECRET (not recommended).",
  },
  {
    key: "SKIP_VERCEL_CRON_SECRET",
    tier: "optional",
    summary: "Set to 1/true only to bypass CRON_SECRET check when you intentionally do not protect cron routes.",
    howToGet: "Avoid in production; prefer setting CRON_SECRET.",
  },
  {
    key: "OPENAI_API_KEY",
    tier: "recommended",
    summary: "Powers AI features: Growth OS insights, lead intake, blog/newsletter helpers, operator tools.",
    howToGet: "platform.openai.com → API keys → Create. App degrades to mock/offline modes when unset.",
  },
  {
    key: "GOS_OPENAI_MODEL",
    tier: "optional",
    summary: "Override default OpenAI model for Growth OS (defaults to gpt-4o-mini).",
    howToGet: "Optional; e.g. gpt-4o — only if OPENAI_API_KEY is set.",
  },
  {
    key: "GOS_INTELLIGENCE_MODE",
    tier: "optional",
    summary: "Force live vs mock Growth intelligence (normally derived from OPENAI_API_KEY).",
    howToGet: "Rarely needed; see server growthIntelligenceConfig.",
  },
  {
    key: "LEAD_INTAKE_AI_MODEL",
    tier: "optional",
    summary: "Model for lead intake AI parsing when using OpenAI.",
    howToGet: "Optional override; defaults to gpt-4o-mini.",
  },
  {
    key: "GOOGLE_CLIENT_ID",
    tier: "optional",
    summary: "“Sign in with Google” OAuth (admin/auth).",
    howToGet: "Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID (Web).",
  },
  {
    key: "GOOGLE_CLIENT_SECRET",
    tier: "optional",
    summary: "Google OAuth client secret (pair with GOOGLE_CLIENT_ID).",
    howToGet: "Same OAuth client in Google Cloud Console → copy secret.",
  },
  {
    key: "GITHUB_CLIENT_ID",
    tier: "optional",
    summary: "GitHub OAuth for admin login.",
    howToGet: "GitHub → Settings → Developer settings → OAuth Apps → Client ID.",
  },
  {
    key: "GITHUB_CLIENT_SECRET",
    tier: "optional",
    summary: "GitHub OAuth client secret.",
    howToGet: "Same GitHub OAuth App → generate/copy client secret.",
  },
  {
    key: "GITHUB_TOKEN",
    tier: "optional",
    summary: "GitHub API (repos, changelog, optional dev-updates); fine-grained or classic PAT.",
    howToGet: "GitHub → Settings → Developer settings → Personal access tokens — scope repo as needed.",
  },
  {
    key: "GITHUB_USERNAME",
    tier: "optional",
    summary: "Default GitHub username for API calls when repo is implicit.",
    howToGet: "Your GitHub handle; optional if token embeds user context.",
  },
  {
    key: "FROM_EMAIL",
    tier: "recommended",
    summary: "Verified sender address in Brevo for outbound mail.",
    howToGet: "Brevo → Senders & IP → add/verify domain and sender email; paste same address here.",
  },
  {
    key: "FROM_NAME",
    tier: "optional",
    summary: "Display name on outbound emails (e.g. Ascendra Technologies).",
    howToGet: "Any string; optional with sensible default in code.",
  },
  {
    key: "BREVO_FROM_EMAIL",
    tier: "optional",
    summary: "Legacy alternate env for sender if FROM_EMAIL is not used.",
    howToGet: "Same as FROM_EMAIL if you use this name in your deployment.",
  },
  {
    key: "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    tier: "optional",
    summary: "Google Analytics 4 measurement ID for gtag on the marketing site.",
    howToGet: "GA4 → Admin → Data streams → Web → Measurement ID (G-…).",
  },
  {
    key: "GA4_PROPERTY_ID",
    tier: "optional",
    summary: "Server-side GA4 Data API: property numeric ID for admin demographics.",
    howToGet: "GA4 → Admin → Property settings → Property ID.",
  },
  {
    key: "GA4_CLIENT_EMAIL",
    tier: "optional",
    summary: "Service account email granted Viewer on the GA4 property.",
    howToGet: "Google Cloud → IAM → Service account → email ending in @….iam.gserviceaccount.com.",
  },
  {
    key: "GA4_PRIVATE_KEY",
    tier: "optional",
    summary: "Service account JSON private key (PEM) for GA4 API.",
    howToGet: "Create JSON key for that service account; paste private_key value (escape newlines as \\n if one line).",
  },
  {
    key: "FACEBOOK_APP_ID",
    tier: "optional",
    summary: "Facebook Login / Marketing API app id (admin integrations).",
    howToGet: "developers.facebook.com → Your app → Settings → Basic → App ID.",
  },
  {
    key: "FACEBOOK_APP_SECRET",
    tier: "optional",
    summary: "Facebook app secret.",
    howToGet: "Same app → Settings → Basic → App secret.",
  },
  {
    key: "FACEBOOK_ACCESS_TOKEN",
    tier: "optional",
    summary: "Page or system user access token for Meta/Facebook insights.",
    howToGet: "Meta Business Suite / Graph API Explorer — long-lived page token; rotate periodically.",
  },
  {
    key: "FACEBOOK_PAGE_ID",
    tier: "optional",
    summary: "Facebook Page ID for analytics integrations.",
    howToGet: "Page → About / Page transparency or Graph API.",
  },
  {
    key: "META_ACCESS_TOKEN",
    tier: "optional",
    summary: "Alias read by code if FACEBOOK_ACCESS_TOKEN is unset.",
    howToGet: "Same as Facebook access token; use one pair consistently.",
  },
  {
    key: "META_PAGE_ID",
    tier: "optional",
    summary: "Alias for page id if FACEBOOK_PAGE_ID is unset.",
    howToGet: "Same as Facebook page id.",
  },
  {
    key: "UPSTASH_REDIS_REST_URL",
    tier: "optional",
    summary: "Upstash Redis REST URL for cross-instance rate limits.",
    howToGet: "console.upstash.com → database → REST API → UPSTASH_REDIS_REST_URL.",
  },
  {
    key: "UPSTASH_REDIS_REST_TOKEN",
    tier: "optional",
    summary: "Upstash REST token (pair with URL).",
    howToGet: "Same Upstash console → copy token.",
  },
  {
    key: "ZOOM_ACCOUNT_ID",
    tier: "optional",
    summary: "Zoom Server-to-Server OAuth: CRM meeting scheduling.",
    howToGet: "marketplace.zoom.us → Build → Server-to-Server OAuth app → Account ID.",
  },
  {
    key: "ZOOM_CLIENT_ID",
    tier: "optional",
    summary: "Zoom S2S OAuth client id.",
    howToGet: "Same Zoom app → Client ID.",
  },
  {
    key: "ZOOM_CLIENT_SECRET",
    tier: "optional",
    summary: "Zoom S2S OAuth client secret.",
    howToGet: "Same Zoom app → Client Secret.",
  },
  {
    key: "APOLLO_API_KEY",
    tier: "optional",
    summary: "Apollo.io enrichment for CRM contacts.",
    howToGet: "apollo.io → Settings → API → API key.",
  },
  {
    key: "TWILIO_ACCOUNT_SID",
    tier: "optional",
    summary: "Twilio account SID for SMS (admin chat SMS).",
    howToGet: "console.twilio.com → Account Info.",
  },
  {
    key: "TWILIO_AUTH_TOKEN",
    tier: "optional",
    summary: "Twilio auth token.",
    howToGet: "Twilio console → Account API credentials.",
  },
  {
    key: "TWILIO_FROM_NUMBER",
    tier: "optional",
    summary: "Twilio phone number to send SMS from.",
    howToGet: "Twilio → Phone Numbers → active number in E.164.",
  },
  {
    key: "VAPID_PUBLIC_KEY",
    tier: "optional",
    summary: "Web Push public key for browser push notifications.",
    howToGet: "Run: npx web-push generate-vapid-keys — paste public key.",
  },
  {
    key: "VAPID_PRIVATE_KEY",
    tier: "optional",
    summary: "Web Push private key (keep secret).",
    howToGet: "Same web-push command output.",
  },
  {
    key: "ADMIN_PHONE",
    tier: "optional",
    summary: "SMS recipient when routing admin chat to SMS.",
    howToGet: "Your E.164 mobile number if using Twilio SMS.",
  },
  {
    key: "SUPER_ADMIN_USERNAMES",
    tier: "optional",
    summary: "Comma-separated usernames with break-glass super-admin access.",
    howToGet: "Optional; defaults include configured legacy username — set only for extra admins.",
  },
  {
    key: "SUPER_ADMIN_EMAILS",
    tier: "optional",
    summary: "Comma-separated emails matching super-admin identity rules.",
    howToGet: "Optional override; see shared/super-admin-email.ts default.",
  },
  {
    key: "DEVELOPMENT_UPDATES_RAW_URL",
    tier: "recommended",
    summary: "GitHub raw URL for admin “Development updates” digest (content/development-updates.md on main).",
    howToGet:
      "Optional on Vercel: owner/slug env vars build the URL automatically. Otherwise: raw.githubusercontent.com/OWNER/REPO/main/content/development-updates.md",
  },
  {
    key: "DEVELOPMENT_UPDATES_GITHUB_REF",
    tier: "optional",
    summary: "Git ref in the auto-built raw URL (default main). Use if your production branch is not main.",
    howToGet: "Set to your default branch name if it differs from main.",
  },
  {
    key: "DEVELOPMENT_UPDATES_GITHUB_TOKEN",
    tier: "optional",
    summary: "Token for fetching private repo markdown for dev updates (or uses GITHUB_TOKEN).",
    howToGet: "Fine-grained PAT with Contents read on that repo.",
  },
  {
    key: "PROPOSAL_COMPANY_NAME",
    tier: "optional",
    summary: "“Prepared by” line on client-facing proposals.",
    howToGet: "Your legal/trade name string.",
  },
  {
    key: "GITHUB_CHANGELOG_REPO",
    tier: "optional",
    summary: "Optional repo spec for changelog features in githubService.",
    howToGet: "owner/repo format if your deployment uses this feature.",
  },
  {
    key: "CONTENT_STUDIO_SCHEDULED_REQUIRE_APPROVAL",
    tier: "optional",
    summary: "When unset/true, cron social publish requires linked CMS document approvalStatus=approved.",
    howToGet: "Set to 0 or false only if you accept auto-publishing without explicit approval.",
  },
  {
    key: "LINKEDIN_ACCESS_TOKEN",
    tier: "optional",
    summary: "Content Studio calendar: post to LinkedIn via UGC API (pair with LINKEDIN_AUTHOR_URN).",
    howToGet: "LinkedIn Developer app → OAuth 2.0 user token with w_member_social (or org posting scope).",
  },
  {
    key: "LINKEDIN_AUTHOR_URN",
    tier: "optional",
    summary: "Author URN for LinkedIn posts, e.g. urn:li:person:… or urn:li:organization:….",
    howToGet: "From LinkedIn profile/org ID; format urn:li:person:{id} per LinkedIn REST docs.",
  },
  {
    key: "X_OAUTH2_ACCESS_TOKEN",
    tier: "optional",
    summary: "Content Studio: post to X via API v2 (OAuth 2.0 user token with tweet.write).",
    howToGet: "X Developer Portal → user access token; alias TWITTER_OAUTH2_ACCESS_TOKEN also read.",
  },
  {
    key: "CONTENT_STUDIO_PUBLISH_WEBHOOK_URL",
    tier: "optional",
    summary: "POST JSON payload to Buffer/Make/Zapier or custom receiver when calendar target is webhook_hub.",
    howToGet: "HTTPS URL that accepts application/json; optional CONTENT_STUDIO_PUBLISH_WEBHOOK_SECRET for HMAC header.",
  },
  {
    key: "CONTENT_STUDIO_BREVO_NOTIFY_TO",
    tier: "optional",
    summary: "Recipient for brevo_notify adapter (email summary only); falls back to ADMIN_EMAIL.",
    howToGet: "Inbox that should receive “scheduled publish” notifications; requires BREVO_API_KEY and FROM_EMAIL.",
  },
];

/** Keys in checklist order (must match health route iteration). */
export const SYSTEM_ENV_KEYS: string[] = SYSTEM_ENV_CHECKLIST.map((e) => e.key);
