import { z } from "zod";

/** Primary conversion posture for a funnel slug — controls which CTAs visitors see first. */
export const funnelAccessModelSchema = z.enum(["book_now", "request_call", "apply_first", "form_only"]);
export type FunnelAccessModel = z.infer<typeof funnelAccessModelSchema>;

/** How much qualification friction the page applies (for ops + A/B alignment). */
export const funnelFrictionLevelSchema = z.enum(["open", "balanced", "controlled"]);
export type FunnelFrictionLevel = z.infer<typeof funnelFrictionLevelSchema>;

export const FUNNEL_ACCESS_MODEL_LABELS: Record<FunnelAccessModel, { label: string; description: string }> = {
  book_now: {
    label: "Book now",
    description: "Primary path emphasizes scheduling / calendar (speed for warm traffic).",
  },
  request_call: {
    label: "Request call",
    description: "Soft ask for a call or callback — good when trust is still building.",
  },
  apply_first: {
    label: "Apply first",
    description: "Application or assessment before booking (more filter, fewer junk calls).",
  },
  form_only: {
    label: "Form only",
    description: "Lead capture forms and tools; de-emphasize calendar CTAs on this funnel.",
  },
};

export const FUNNEL_FRICTION_LABELS: Record<FunnelFrictionLevel, { label: string; description: string }> = {
  open: {
    label: "Open capture",
    description: "Minimal fields — optimize for volume; pair with AEE tests on follow-up.",
  },
  balanced: {
    label: "Balanced",
    description: "Standard name + email + one qualifier when the template supports it.",
  },
  controlled: {
    label: "Controlled",
    description: "Stricter qualification — fewer leads, higher intent; mirror in experiment variants.",
  },
};

export const DEFAULT_FUNNEL_ACCESS_MODEL: FunnelAccessModel = "request_call";
export const DEFAULT_FUNNEL_FRICTION_LEVEL: FunnelFrictionLevel = "balanced";

export function parseFunnelConversionSettings(data: Record<string, unknown> | null | undefined): {
  accessModel: FunnelAccessModel;
  frictionLevel: FunnelFrictionLevel;
} {
  const raw = data ?? {};
  const access = funnelAccessModelSchema.safeParse(raw.accessModel);
  const friction = funnelFrictionLevelSchema.safeParse(raw.leadFrictionLevel);
  return {
    accessModel: access.success ? access.data : DEFAULT_FUNNEL_ACCESS_MODEL,
    frictionLevel: friction.success ? friction.data : DEFAULT_FUNNEL_FRICTION_LEVEL,
  };
}
