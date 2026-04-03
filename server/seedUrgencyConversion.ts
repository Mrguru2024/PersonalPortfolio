import { sql } from "drizzle-orm";
import { db } from "./db";
import { urgencyConversionSurfaces } from "@shared/schema";

/** Default surfaces — all start inactive until an admin turns them on in /admin/urgency-conversion */
const STARTER_ROWS = [
  {
    surfaceKey: "startup-growth-kit",
    displayName: "Startup Growth Kit",
    isActive: false,
    urgencyMode: "early_access" as const,
    scarcityMode: "manual_review" as const,
    capacitySource: "none" as const,
    earlyAccessLabel: "Founder resource",
    manualReviewLabel: "Curated for serious builders",
    proofTitle: "Why access is structured this way",
    proofBulletsJson: [
      "We keep this path focused so founders get a clear sequence: diagnose → measure → decide.",
      "Manual review on later steps helps us give relevant next steps instead of generic templates.",
    ],
    lossTitle: "What unclear systems often cost",
    lossBulletsJson: [
      "A site that looks fine but does not convert still burns attention and ad spend.",
      "Inconsistent follow-up usually loses leads that would have said yes with a simple system.",
    ],
    defaultCtaVariantKey: "default",
    ctaVariantsJson: [] as { key: string; primaryText: string; subText?: string; href: string }[],
    prerequisiteSurfaceKey: null,
    funnelSlugForScarcity: "growth-kit",
  },
  {
    surfaceKey: "startup-website-score",
    displayName: "Startup Website Score",
    isActive: false,
    urgencyMode: "results_unlock" as const,
    scarcityMode: "tool_unlock" as const,
    capacitySource: "none" as const,
    prerequisiteSurfaceKey: "startup-growth-kit",
    proofTitle: "Why we ask a few questions first",
    proofBulletsJson: [
      "Short inputs keep scoring consistent so suggestions stay practical.",
      "We cap depth on this free tool so you get a fast signal, not a 40-field audit.",
    ],
    lossTitle: "When a site scores low",
    lossBulletsJson: [
      "Visitors bounce when the offer and CTA are fuzzy — not because the design is ugly.",
      "Weak lead capture means paid traffic leaks even if clicks look fine.",
    ],
    defaultCtaVariantKey: "default",
    ctaVariantsJson: [],
    earlyAccessLabel: null,
    manualReviewLabel: null,
    funnelSlugForScarcity: "website-score",
  },
  {
    surfaceKey: "revenue-calculator",
    displayName: "Revenue Calculator",
    isActive: false,
    urgencyMode: "daily_window" as const,
    scarcityMode: "capacity" as const,
    capacitySource: "daily_count" as const,
    dailyCapacityMax: 40,
    weeklyCapacityMax: null,
    countDisplayMode: "approximate" as const,
    dailyWindowEndLocal: "23:59",
    proofTitle: "Honest limits on free tools",
    proofBulletsJson: [
      "We cap daily usage so results stay fast and we can support serious follow-ups.",
      "Numbers here are directional — they highlight opportunity gaps, not guarantees.",
    ],
    lossTitle: "The hidden cost of conversion gaps",
    lossBulletsJson: [
      "Low-converting pages waste paid traffic even when click costs look normal.",
      "Slow follow-up quietly shrinks close rate on otherwise good leads.",
    ],
    defaultCtaVariantKey: "default",
    ctaVariantsJson: [],
    prerequisiteSurfaceKey: "startup-website-score",
    earlyAccessLabel: null,
    manualReviewLabel: null,
    funnelSlugForScarcity: null,
  },
  {
    surfaceKey: "strategy-call",
    displayName: "Strategy call",
    isActive: false,
    urgencyMode: "weekly_review" as const,
    scarcityMode: "manual_review" as const,
    capacitySource: "none" as const,
    manualReviewLabel: "Applications reviewed in batches",
    proofTitle: "Why we review requests",
    proofBulletsJson: [
      "We read each request so time on the call goes to fit and priorities — not discovery from zero.",
      "If we are not the right partner, we will point you to a better next step.",
    ],
    lossTitle: "If timing stays fuzzy",
    lossBulletsJson: [
      "Growth work without a prioritized backlog often stalls after the first sprint.",
      "Misaligned scope is expensive — a short structured call reduces that risk.",
    ],
    defaultCtaVariantKey: "default",
    ctaVariantsJson: [],
    prerequisiteSurfaceKey: null,
    earlyAccessLabel: null,
    funnelSlugForScarcity: null,
  },
] as const;

export async function seedUrgencyConversionStarters(): Promise<void> {
  for (const r of STARTER_ROWS) {
    await db
      .insert(urgencyConversionSurfaces)
      .values({
        surfaceKey: r.surfaceKey,
        displayName: r.displayName,
        isActive: r.isActive,
        urgencyMode: r.urgencyMode,
        scarcityMode: r.scarcityMode,
        capacitySource: r.capacitySource,
        dailyCapacityMax: "dailyCapacityMax" in r ? r.dailyCapacityMax : null,
        weeklyCapacityMax: "weeklyCapacityMax" in r ? r.weeklyCapacityMax : null,
        countDisplayMode: "countDisplayMode" in r ? r.countDisplayMode : "exact",
        batchEndsAt: null,
        dailyWindowEndLocal: "dailyWindowEndLocal" in r ? r.dailyWindowEndLocal : null,
        timezone: "America/New_York",
        prerequisiteSurfaceKey: r.prerequisiteSurfaceKey,
        earlyAccessLabel: "earlyAccessLabel" in r ? r.earlyAccessLabel : null,
        qualificationFilterLabel: null,
        manualReviewLabel: "manualReviewLabel" in r ? r.manualReviewLabel : null,
        proofTitle: r.proofTitle,
        proofBulletsJson: [...r.proofBulletsJson],
        lossTitle: r.lossTitle,
        lossBulletsJson: [...r.lossBulletsJson],
        defaultCtaVariantKey: r.defaultCtaVariantKey,
        ctaVariantsJson: [],
        growthExperimentKey: null,
        scarcityEngineConfigId: null,
        funnelSlugForScarcity: "funnelSlugForScarcity" in r ? r.funnelSlugForScarcity : null,
        offerSlugForScarcity: null,
        leadMagnetSlugForScarcity: null,
        analyticsEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing({ target: urgencyConversionSurfaces.surfaceKey });
  }
}
