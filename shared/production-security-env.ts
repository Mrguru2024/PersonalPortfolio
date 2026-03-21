import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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
 * Whether Vercel cron routes are declared in vercel.json. If the file is missing or unreadable at runtime (some
 * serverless layouts), we treat that as "unknown" and still require CRON_SECRET on Vercel production.
 */
function vercelCronSecretRequirement(): "require" | "skip" {
  try {
    const p = join(process.cwd(), "vercel.json");
    if (!existsSync(p)) return "require";
    const raw = readFileSync(p, "utf8");
    const j = JSON.parse(raw) as { crons?: unknown };
    const hasCrons = Array.isArray(j.crons) && j.crons.length > 0;
    return hasCrons ? "require" : "skip";
  } catch {
    return "require";
  }
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
   * When vercel.json defines crons, Vercel calls those routes on a schedule. Require CRON_SECRET so jobs are not
   * trivially callable without the Bearer token. If vercel.json is present with an empty/missing "crons" array, this
   * check is skipped. If vercel.json cannot be read at runtime, we still require CRON_SECRET (fail closed).
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
        `[security] Vercel production requires CRON_SECRET (at least ${MIN_CRON_SECRET_LENGTH} characters) because vercel.json defines crons (e.g. /api/cron/growth-os), or vercel.json could not be read at runtime. Add CRON_SECRET in the Vercel project env, remove the "crons" array from vercel.json (and redeploy), or set SKIP_VERCEL_CRON_SECRET=1 only if you accept weaker protection for scheduled routes (not recommended).`,
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
