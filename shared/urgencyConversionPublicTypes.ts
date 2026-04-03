/** Keep in sync with urgencyConversionSchema (avoid importing drizzle into client bundles). */
export type UrgencyUrgencyModePublic =
  | "none"
  | "batch_close"
  | "daily_window"
  | "weekly_review"
  | "results_unlock"
  | "early_access";

export type UrgencyScarcityModePublic =
  | "none"
  | "capacity"
  | "qualified_access"
  | "manual_review"
  | "beta_pilot"
  | "tool_unlock";

/** Serializable payload for GET /api/public/urgency-conversion/[surfaceKey] */
export type PublicUrgencyCta = {
  key: string;
  primaryText: string;
  subText?: string;
  href: string;
  urgencyBadge?: string;
  scarcityNote?: string;
  proofNote?: string;
  variantKey: string;
};

export type PublicUrgencyPayload = {
  active: boolean;
  surfaceKey: string;
  displayName: string;
  urgencyMode: UrgencyUrgencyModePublic;
  scarcityMode: UrgencyScarcityModePublic;
  badges: string[];
  capacity?: {
    used: number;
    max: number | null;
    displayMode: string;
    label: string;
    approximate?: boolean;
  };
  countdown?: { endsAtIso: string; label: string } | null;
  proof?: { title: string | null; bullets: string[] };
  loss?: { title: string | null; bullets: string[] };
  cta: PublicUrgencyCta | null;
  prerequisiteSurfaceKey: string | null;
  growthExperimentKey: string | null;
  microCommitment: {
    surfaceKey: string;
    funnelStepIndex: number;
    funnelSteps: { key: string; label: string; href: string }[];
  };
  analyticsEnabled: boolean;
};
