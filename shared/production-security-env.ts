const WEAK_SESSION_SECRETS = new Set(
  [
    "mrguru-portfolio-session-secret",
    "keyboard cat",
    "your_secure_random_string_here",
    "dev-session-secret-not-for-production",
    "dev-only-weak-secret-change-me",
    "tracking-secret",
  ].map((s) => s.toLowerCase()),
);

export const MIN_SESSION_SECRET_LENGTH = 32;
export const MIN_CRON_SECRET_LENGTH = 16;

/**
 * Whether Vercel production should enforce CRON_SECRET at boot.
 * No filesystem reads — keeps this module Edge-safe when pulled in via `instrumentation.ts`.
 *
 * - Default: require (this repo ships crons; fail closed).
 * - Set VERCEL_CRONS_DISABLED=1 (or true) if you deploy without any `vercel.json` crons and do not want CRON_SECRET enforced at boot.
 */
function vercelCronSecretRequirement(): "require" | "skip" {
  const disabled = process.env.VERCEL_CRONS_DISABLED?.trim().toLowerCase();
  if (disabled === "1" || disabled === "true" || disabled === "yes") return "skip";
  return "require";
}

/**
 * Fail fast in production when session or cron secrets are missing, too short, or known placeholders.
 * Call from Next.js `instrumentation.ts` on server boot.
 */
export function assertProductionSecurityEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < MIN_SESSION_SECRET_LENGTH) {
    throw new Error(
      `[security] Production requires SESSION_SECRET of at least ${MIN_SESSION_SECRET_LENGTH} characters (e.g. openssl rand -base64 32).`,
    );
  }
  if (WEAK_SESSION_SECRETS.has(secret.toLowerCase())) {
    throw new Error(
      "[security] SESSION_SECRET must not be a known placeholder or default value.",
    );
  }

  const cron = process.env.CRON_SECRET?.trim();
  if (cron && cron.length < MIN_CRON_SECRET_LENGTH) {
    throw new Error(
      `[security] When set, CRON_SECRET must be at least ${MIN_CRON_SECRET_LENGTH} characters.`,
    );
  }

  /**
   * On Vercel production, require CRON_SECRET so scheduled routes are not trivially callable without the Bearer token.
   * Set SKIP_VERCEL_CRON_SECRET=1 to bypass (not recommended), or VERCEL_CRONS_DISABLED=1 if you have no crons configured.
   */
  const skipCronCheck =
    process.env.SKIP_VERCEL_CRON_SECRET?.trim() === "1" ||
    process.env.SKIP_VERCEL_CRON_SECRET?.toLowerCase() === "true";
  if (
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL === "1" &&
    !skipCronCheck &&
    vercelCronSecretRequirement() === "require"
  ) {
    if (!cron || cron.length < MIN_CRON_SECRET_LENGTH) {
      throw new Error(
        `[security] Vercel production requires CRON_SECRET (at least ${MIN_CRON_SECRET_LENGTH} characters) for scheduled routes. Add CRON_SECRET in the Vercel project env, set VERCEL_CRONS_DISABLED=1 only if you have no vercel.json crons, or set SKIP_VERCEL_CRON_SECRET=1 if you accept weaker protection (not recommended).`,
      );
    }
  }
}

export function getDevSessionSecretFallback(): string {
  return "dev-session-secret-not-for-production";
}

/** Express / legacy servers: never use placeholder secrets in production. */
export function resolveSessionSecretForRuntime(): string {
  const s = process.env.SESSION_SECRET?.trim();
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[security] SESSION_SECRET is required in production (set a strong secret; see .env.example).",
    );
  }
  return getDevSessionSecretFallback();
}
