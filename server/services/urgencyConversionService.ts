import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { endOfWeek, startOfWeek } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { db } from "@server/db";
import { evaluateScarcityForContext } from "@modules/scarcity-engine";
import type { PublicUrgencyPayload } from "@shared/urgencyConversionPublicTypes";
import {
  scarcityEngineConfigs,
  urgencyConversionSurfaces,
  visitorActivity,
  type UrgencyCapacitySource,
  type UrgencyConversionSurfaceRow,
  type UrgencyCtaVariant,
  type UrgencyScarcityMode,
  type UrgencyUrgencyMode,
} from "@shared/schema";

const COMPLETION_EVENT_TYPES = [
  "tool_used",
  "calculator_complete",
  "form_submit",
  "form_completed",
  "market_score_complete",
  "funnel_micro_step",
] as const;

function startOfZonedDayUtc(now: Date, timeZone: string): Date {
  const z = toZonedTime(now, timeZone);
  z.setHours(0, 0, 0, 0);
  return fromZonedTime(z, timeZone);
}

function startOfZonedWeekUtc(now: Date, timeZone: string): Date {
  const z = toZonedTime(now, timeZone);
  const sow = startOfWeek(z, { weekStartsOn: 1 });
  sow.setHours(0, 0, 0, 0);
  return fromZonedTime(sow, timeZone);
}

async function countSurfaceCompletions(
  surfaceKey: string,
  sinceUtc: Date,
): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(visitorActivity)
    .where(
      and(
        gte(visitorActivity.createdAt, sinceUtc),
        inArray(visitorActivity.eventType, [...COMPLETION_EVENT_TYPES] as string[]),
        sql`${visitorActivity.metadata} ->> 'urgencySurface' = ${surfaceKey}`,
      ),
    );
  return Number(row?.n ?? 0);
}

async function countSurfaceViews(surfaceKey: string, sinceUtc: Date): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(visitorActivity)
    .where(
      and(
        gte(visitorActivity.createdAt, sinceUtc),
        eq(visitorActivity.eventType, "urgency_surface_view"),
        sql`${visitorActivity.metadata} ->> 'urgencySurface' = ${surfaceKey}`,
      ),
    );
  return Number(row?.n ?? 0);
}

function nextDailyWindowEndIso(now: Date, endLocalHHmm: string | null | undefined, tz: string): string | null {
  if (!endLocalHHmm?.trim()) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(endLocalHHmm.trim());
  if (!m) return null;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  const z = toZonedTime(now, tz);
  const y = z.getFullYear();
  const mo = z.getMonth();
  const d = z.getDate();
  const pseudo = new Date(y, mo, d, h, min, 0, 0);
  let endUtc = fromZonedTime(pseudo, tz);
  if (endUtc.getTime() <= now.getTime()) {
    endUtc = new Date(endUtc.getTime() + 24 * 60 * 60 * 1000);
  }
  return endUtc.toISOString();
}

function pickCtaVariant(
  row: UrgencyConversionSurfaceRow,
  experimentVariantKey: string | null,
): UrgencyCtaVariant | null {
  const variants = row.ctaVariantsJson?.length ? row.ctaVariantsJson : defaultVariantsForSurface(row.surfaceKey);
  if (!variants.length) return null;
  if (experimentVariantKey) {
    const match = variants.find((v) => v.key === experimentVariantKey);
    if (match) return match;
  }
  const def = variants.find((v) => v.key === row.defaultCtaVariantKey);
  return def ?? variants[0] ?? null;
}

function defaultVariantsForSurface(surfaceKey: string): UrgencyCtaVariant[] {
  const presets: Record<string, UrgencyCtaVariant[]> = {
    "startup-growth-kit": [
      {
        key: "default",
        primaryText: "Continue to website score",
        subText: "Five questions — see how your site stacks up.",
        href: "/tools/startup-website-score",
        urgencyBadge: "Free tools",
        scarcityNote: "Built for founders who want systems, not just a template.",
      },
    ],
    "startup-website-score": [
      {
        key: "default",
        primaryText: "Unlock my revenue picture",
        subText: "Next: revenue calculator — see what conversion gaps may cost.",
        href: "/website-revenue-calculator",
        urgencyBadge: "Next free tool",
      },
    ],
    "revenue-calculator": [
      {
        key: "default",
        primaryText: "Book a strategy call",
        subText: "Turn numbers into a prioritized growth plan.",
        href: "/strategy-call",
        scarcityNote: "We review requests manually to keep advice relevant.",
      },
    ],
    "strategy-call": [
      {
        key: "default",
        primaryText: "Request your call",
        subText: "Tell us about your business — we follow up with next steps.",
        href: "#strategy-call-form",
        proofNote: "No pressure — if we are not a fit, we will say so.",
      },
    ],
  };
  return presets[surfaceKey] ?? [
    {
      key: "default",
      primaryText: "Continue",
      href: "/",
    },
  ];
}

const FUNNEL_STEPS: { key: string; label: string; href: string }[] = [
  { key: "startup-growth-kit", label: "Diagnose · Growth kit", href: "/resources/startup-growth-kit" },
  { key: "startup-website-score", label: "Diagnose · Website score", href: "/tools/startup-website-score" },
  { key: "revenue-calculator", label: "Diagnose · Revenue calculator", href: "/website-revenue-calculator" },
  { key: "strategy-call", label: "Scale · Strategy call", href: "/strategy-call" },
];

function funnelStepIndexFor(surfaceKey: string): number {
  return Math.max(0, FUNNEL_STEPS.findIndex((s) => s.key === surfaceKey));
}

function buildCapacityLabel(used: number, max: number | null, mode: string): { label: string; approximate: boolean } {
  if (max == null || max <= 0) return { label: "", approximate: false };
  if (mode === "hidden") return { label: "Limited access in this window", approximate: false };
  if (mode === "approximate") {
    const remaining = Math.max(0, max - used);
    if (remaining <= 0) return { label: "This window is full — join the next cycle", approximate: true };
    if (remaining <= Math.ceil(max * 0.2)) return { label: "Almost full for this window", approximate: true };
    return { label: "Space available this window", approximate: true };
  }
  const remaining = Math.max(0, max - used);
  return { label: `${remaining} of ${max} spots remaining this period`, approximate: false };
}

export function validateUrgencySurfaceSettings(row: Partial<UrgencyConversionSurfaceRow>): string[] {
  const warnings: string[] = [];
  if (row.isActive && row.urgencyMode === "batch_close" && row.batchEndsAt) {
    const t = row.batchEndsAt instanceof Date ? row.batchEndsAt : new Date(row.batchEndsAt);
    if (t.getTime() < Date.now()) warnings.push("Batch end time is in the past — countdown will not show.");
  }
  if (row.isActive && row.urgencyMode === "daily_window" && !row.dailyWindowEndLocal?.trim()) {
    warnings.push("Daily window mode needs a local end time (HH:mm).");
  }
  if (
    row.capacitySource === "scarcity_engine" &&
    !row.scarcityEngineConfigId &&
    !row.funnelSlugForScarcity?.trim() &&
    !row.offerSlugForScarcity?.trim() &&
    !row.leadMagnetSlugForScarcity?.trim()
  ) {
    warnings.push("Scarcity Engine capacity needs a linked config or funnel/offer/lead-magnet slug.");
  }
  if (
    row.capacitySource === "daily_count" &&
    (row.dailyCapacityMax == null || row.dailyCapacityMax <= 0)
  ) {
    warnings.push("Daily capacity source needs dailyCapacityMax > 0.");
  }
  if (
    row.capacitySource === "weekly_count" &&
    (row.weeklyCapacityMax == null || row.weeklyCapacityMax <= 0)
  ) {
    warnings.push("Weekly capacity source needs weeklyCapacityMax > 0.");
  }
  if (row.prerequisiteSurfaceKey && row.prerequisiteSurfaceKey === row.surfaceKey) {
    warnings.push("Prerequisite cannot match the same surface.");
  }
  return warnings;
}

export async function listUrgencySurfaces(): Promise<UrgencyConversionSurfaceRow[]> {
  return db.select().from(urgencyConversionSurfaces).orderBy(desc(urgencyConversionSurfaces.updatedAt));
}

export async function getUrgencySurfaceByKey(surfaceKey: string): Promise<UrgencyConversionSurfaceRow | null> {
  const [row] = await db
    .select()
    .from(urgencyConversionSurfaces)
    .where(eq(urgencyConversionSurfaces.surfaceKey, surfaceKey))
    .limit(1);
  return row ?? null;
}

export type UrgencySurfaceWrite = {
  id?: number;
  surfaceKey: string;
  displayName: string;
  isActive: boolean;
  urgencyMode: UrgencyUrgencyMode;
  scarcityMode: UrgencyScarcityMode;
  capacitySource: UrgencyCapacitySource;
  scarcityEngineConfigId?: number | null;
  dailyCapacityMax?: number | null;
  weeklyCapacityMax?: number | null;
  countDisplayMode: UrgencyConversionSurfaceRow["countDisplayMode"];
  batchEndsAt?: Date | null;
  dailyWindowEndLocal?: string | null;
  timezone: string;
  prerequisiteSurfaceKey?: string | null;
  earlyAccessLabel?: string | null;
  qualificationFilterLabel?: string | null;
  manualReviewLabel?: string | null;
  proofTitle?: string | null;
  proofBulletsJson?: string[];
  lossTitle?: string | null;
  lossBulletsJson?: string[];
  defaultCtaVariantKey: string;
  ctaVariantsJson?: UrgencyCtaVariant[];
  growthExperimentKey?: string | null;
  funnelSlugForScarcity?: string | null;
  offerSlugForScarcity?: string | null;
  leadMagnetSlugForScarcity?: string | null;
  analyticsEnabled: boolean;
};

export async function upsertUrgencySurface(input: UrgencySurfaceWrite): Promise<UrgencyConversionSurfaceRow> {
  let ctaVariants = input.ctaVariantsJson;
  if (!ctaVariants?.length) {
    const [existing] = await db
      .select()
      .from(urgencyConversionSurfaces)
      .where(eq(urgencyConversionSurfaces.surfaceKey, input.surfaceKey.trim()))
      .limit(1);
    if (existing?.ctaVariantsJson?.length) ctaVariants = existing.ctaVariantsJson;
  }
  if (!ctaVariants?.length) {
    ctaVariants = defaultVariantsForSurface(input.surfaceKey.trim());
  }

  const values = {
    surfaceKey: input.surfaceKey.trim(),
    displayName: input.displayName.trim(),
    isActive: input.isActive,
    urgencyMode: input.urgencyMode,
    scarcityMode: input.scarcityMode,
    capacitySource: input.capacitySource,
    scarcityEngineConfigId: input.scarcityEngineConfigId ?? null,
    dailyCapacityMax: input.dailyCapacityMax ?? null,
    weeklyCapacityMax: input.weeklyCapacityMax ?? null,
    countDisplayMode: input.countDisplayMode,
    batchEndsAt: input.batchEndsAt ?? null,
    dailyWindowEndLocal: input.dailyWindowEndLocal?.trim() || null,
    timezone: input.timezone?.trim() || "America/New_York",
    prerequisiteSurfaceKey: input.prerequisiteSurfaceKey?.trim() || null,
    earlyAccessLabel: input.earlyAccessLabel?.trim() || null,
    qualificationFilterLabel: input.qualificationFilterLabel?.trim() || null,
    manualReviewLabel: input.manualReviewLabel?.trim() || null,
    proofTitle: input.proofTitle?.trim() || null,
    proofBulletsJson: input.proofBulletsJson ?? [],
    lossTitle: input.lossTitle?.trim() || null,
    lossBulletsJson: input.lossBulletsJson ?? [],
    defaultCtaVariantKey: input.defaultCtaVariantKey.trim() || "default",
    ctaVariantsJson: ctaVariants,
    growthExperimentKey: input.growthExperimentKey?.trim() || null,
    funnelSlugForScarcity: input.funnelSlugForScarcity?.trim() || null,
    offerSlugForScarcity: input.offerSlugForScarcity?.trim() || null,
    leadMagnetSlugForScarcity: input.leadMagnetSlugForScarcity?.trim() || null,
    analyticsEnabled: input.analyticsEnabled,
    updatedAt: new Date(),
  };

  if (input.id) {
    const [updated] = await db
      .update(urgencyConversionSurfaces)
      .set(values)
      .where(eq(urgencyConversionSurfaces.id, input.id))
      .returning();
    if (updated) return updated;
  }

  const [created] = await db
    .insert(urgencyConversionSurfaces)
    .values({
      ...values,
      createdAt: new Date(),
    })
    .returning();
  return created;
}

export async function resolvePublicUrgencyPayload(
  surfaceKey: string,
  options?: { experimentVariantKey?: string | null },
): Promise<PublicUrgencyPayload> {
  const row = await getUrgencySurfaceByKey(surfaceKey);
  if (!row || !row.isActive) {
    return {
      active: false,
      surfaceKey,
      displayName: surfaceKey,
      urgencyMode: "none",
      scarcityMode: "none",
      badges: [],
      cta: null,
      prerequisiteSurfaceKey: null,
      growthExperimentKey: null,
      microCommitment: {
        surfaceKey,
        funnelStepIndex: funnelStepIndexFor(surfaceKey),
        funnelSteps: FUNNEL_STEPS,
      },
      analyticsEnabled: false,
    } as PublicUrgencyPayload;
  }

  const tz = row.timezone || "America/New_York";
  const now = new Date();
  const badges: string[] = [];

  if (row.earlyAccessLabel?.trim()) badges.push(row.earlyAccessLabel.trim());
  if (row.scarcityMode === "beta_pilot") badges.push("Beta access");
  if (row.scarcityMode === "manual_review") badges.push(row.manualReviewLabel?.trim() || "Manually reviewed");
  if (row.scarcityMode === "qualified_access" && row.qualificationFilterLabel?.trim()) {
    badges.push(row.qualificationFilterLabel.trim());
  }

  let used = 0;
  let max: number | null = null;

  if (row.capacitySource === "daily_count" && row.dailyCapacityMax != null && row.dailyCapacityMax > 0) {
    const start = startOfZonedDayUtc(now, tz);
    used = await countSurfaceCompletions(row.surfaceKey, start);
    max = row.dailyCapacityMax;
  } else if (row.capacitySource === "weekly_count" && row.weeklyCapacityMax != null && row.weeklyCapacityMax > 0) {
    const start = startOfZonedWeekUtc(now, tz);
    used = await countSurfaceCompletions(row.surfaceKey, start);
    max = row.weeklyCapacityMax;
  } else if (row.capacitySource === "scarcity_engine") {
    let funnelSlug = row.funnelSlugForScarcity ?? undefined;
    let offerSlug = row.offerSlugForScarcity ?? undefined;
    let leadMagnetSlug = row.leadMagnetSlugForScarcity ?? undefined;
    if (row.scarcityEngineConfigId != null) {
      const [cfg] = await db
        .select()
        .from(scarcityEngineConfigs)
        .where(eq(scarcityEngineConfigs.id, row.scarcityEngineConfigId))
        .limit(1);
      if (cfg) {
        funnelSlug = funnelSlug ?? cfg.funnelLimit ?? undefined;
        offerSlug = offerSlug ?? cfg.offerLimit ?? undefined;
        leadMagnetSlug = leadMagnetSlug ?? cfg.leadMagnetLimit ?? undefined;
      }
    }
    const scarcity = await evaluateScarcityForContext({
      funnelSlug,
      offerSlug,
      leadMagnetSlug,
    }).catch(() => null);
    if (scarcity) {
      used = scarcity.usedSlots;
      max = scarcity.usedSlots + scarcity.availableSlots;
    }
  }

  const { label: capLabel, approximate } =
    row.scarcityMode === "capacity" || row.capacitySource !== "none"
      ? buildCapacityLabel(used, max, row.countDisplayMode)
      : { label: "", approximate: false };

  const capacity =
    max != null && max > 0 && (row.scarcityMode === "capacity" || row.capacitySource !== "none")
      ? {
          used,
          max,
          displayMode: row.countDisplayMode,
          label: capLabel,
          approximate,
        }
      : undefined;

  let countdown: { endsAtIso: string; label: string } | null = null;
  if (row.urgencyMode === "batch_close" && row.batchEndsAt) {
    const end = row.batchEndsAt instanceof Date ? row.batchEndsAt : new Date(row.batchEndsAt);
    if (end.getTime() > now.getTime()) {
      countdown = { endsAtIso: end.toISOString(), label: "Current intake window closes" };
    }
  } else if (row.urgencyMode === "daily_window") {
    const iso = nextDailyWindowEndIso(now, row.dailyWindowEndLocal, tz);
    if (iso) {
      countdown = { endsAtIso: iso, label: "Today’s free access ends" };
    }
  } else if (row.urgencyMode === "weekly_review") {
    const z = toZonedTime(now, tz);
    const eow = endOfWeek(z, { weekStartsOn: 1 });
    eow.setHours(23, 59, 59, 999);
    const utcEnd = fromZonedTime(eow, tz);
    if (utcEnd.getTime() > now.getTime()) {
      countdown = { endsAtIso: utcEnd.toISOString(), label: "This week’s review window ends" };
    }
  }

  const proof =
    row.proofTitle || (row.proofBulletsJson?.length ?? 0) > 0
      ? { title: row.proofTitle, bullets: row.proofBulletsJson ?? [] }
      : undefined;

  const loss =
    row.lossTitle || (row.lossBulletsJson?.length ?? 0) > 0
      ? { title: row.lossTitle, bullets: row.lossBulletsJson ?? [] }
      : undefined;

  const variant = pickCtaVariant(row, options?.experimentVariantKey ?? null);
  const cta = variant
    ? {
        ...variant,
        variantKey: variant.key,
      }
    : null;

  return {
    active: true,
    surfaceKey: row.surfaceKey,
    displayName: row.displayName,
    urgencyMode: row.urgencyMode as UrgencyUrgencyMode,
    scarcityMode: row.scarcityMode as UrgencyScarcityMode,
    badges,
    capacity,
    countdown,
    proof,
    loss,
    cta,
    prerequisiteSurfaceKey: row.prerequisiteSurfaceKey,
    growthExperimentKey: row.growthExperimentKey,
    microCommitment: {
      surfaceKey: row.surfaceKey,
      funnelStepIndex: funnelStepIndexFor(row.surfaceKey),
      funnelSteps: FUNNEL_STEPS,
    },
    analyticsEnabled: row.analyticsEnabled,
  } as PublicUrgencyPayload;
}

export async function getUrgencyAdminAnalyticsSnapshot(surfaceKey: string, timeZone: string) {
  const dayStart = startOfZonedDayUtc(new Date(), timeZone);
  const weekStart = startOfZonedWeekUtc(new Date(), timeZone);
  const [viewsDay, viewsWeek, completionsDay, completionsWeek] = await Promise.all([
    countSurfaceViews(surfaceKey, dayStart),
    countSurfaceViews(surfaceKey, weekStart),
    countSurfaceCompletions(surfaceKey, dayStart),
    countSurfaceCompletions(surfaceKey, weekStart),
  ]);
  return {
    surfaceKey,
    viewsDay,
    viewsWeek,
    completionsDay,
    completionsWeek,
  };
}
