/**
 * Client account trial windows — pure helpers (no DB). Used by API routes and tests.
 * Duration: CLIENT_TRIAL_DAYS env (default 14, clamped 1–90).
 */

export const DEFAULT_CLIENT_TRIAL_DAYS = 14;

export function resolveClientTrialDurationDays(): number {
  const raw = typeof process !== "undefined" ? process.env.CLIENT_TRIAL_DAYS : undefined;
  const n = raw != null && raw !== "" ? Number.parseInt(String(raw), 10) : NaN;
  if (!Number.isFinite(n)) return DEFAULT_CLIENT_TRIAL_DAYS;
  return Math.min(90, Math.max(1, n));
}

export function defaultClientTrialWindow(
  durationDays: number = resolveClientTrialDurationDays(),
): { trialStartedAt: Date; trialEndsAt: Date } {
  const trialStartedAt = new Date();
  const trialEndsAt = new Date(trialStartedAt);
  trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + durationDays);
  return { trialStartedAt, trialEndsAt };
}

export type TrialClientSummary = {
  /** False for operators (any admin, super users, developers) — no trial UX. */
  showBanner: boolean;
  active: boolean;
  expired: boolean;
  startsAt: string | null;
  endsAt: string | null;
  /** Whole days left while active (minimum 0). */
  daysRemaining: number | null;
  configuredDays: number;
};

type UserLikeForTrial = {
  trialStartedAt?: Date | string | null;
  trialEndsAt?: Date | string | null;
  isAdmin?: boolean | null;
  adminApproved?: boolean | null;
  isSuperUser?: boolean | null;
  role?: string | null;
};

export function buildTrialSummaryForClient(user: UserLikeForTrial): TrialClientSummary {
  const configuredDays = resolveClientTrialDurationDays();

  const isOperator =
    user.isSuperUser === true ||
    user.isAdmin === true ||
    user.role === "developer" ||
    user.role === "admin";

  if (isOperator) {
    return {
      showBanner: false,
      active: false,
      expired: false,
      startsAt: null,
      endsAt: null,
      daysRemaining: null,
      configuredDays,
    };
  }

  const endsRaw = user.trialEndsAt;
  const startsRaw = user.trialStartedAt;
  if (endsRaw == null) {
    return {
      showBanner: false,
      active: false,
      expired: false,
      startsAt: null,
      endsAt: null,
      daysRemaining: null,
      configuredDays,
    };
  }

  const ends = new Date(endsRaw);
  const endsMs = ends.getTime();
  if (!Number.isFinite(endsMs)) {
    return {
      showBanner: false,
      active: false,
      expired: false,
      startsAt: null,
      endsAt: null,
      daysRemaining: null,
      configuredDays,
    };
  }

  const starts = startsRaw != null ? new Date(startsRaw) : null;
  let startsIso: string | null = null;
  if (starts != null) {
    const sm = starts.getTime();
    if (Number.isFinite(sm)) startsIso = starts.toISOString();
  }

  const now = Date.now();
  const active = endsMs > now;
  const expired = !active;

  const daysRemaining = active
    ? Math.max(0, Math.ceil((endsMs - now) / 86_400_000))
    : null;

  return {
    showBanner: active,
    active,
    expired,
    startsAt: startsIso,
    endsAt: ends.toISOString(),
    daysRemaining,
    configuredDays,
  };
}
