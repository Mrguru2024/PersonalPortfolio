/** Ascendra Offer Engine — shared enums and labels (admin-only module). */

export const OFFER_ENGINE_LOCKED_PERSONA_IDS = [
  "marcus",
  "kristopher",
  "tasha",
  "devon",
  "andre",
] as const;
export type OfferEngineLockedPersonaId = (typeof OFFER_ENGINE_LOCKED_PERSONA_IDS)[number];

export function isOfferEngineLockedPersona(id: string): id is OfferEngineLockedPersonaId {
  return (OFFER_ENGINE_LOCKED_PERSONA_IDS as readonly string[]).includes(id);
}

export const OFFER_TYPES = [
  "done_for_you",
  "done_with_you",
  "done_by_you",
  "hybrid",
  "free_tool",
  "paid_audit",
  "strategy_session",
  "productized_service",
  "membership_community",
  "starter_offer",
  "premium_offer",
] as const;
export type OfferEngineOfferType = (typeof OFFER_TYPES)[number];

export const OFFER_TYPE_LABELS: Record<OfferEngineOfferType, string> = {
  done_for_you: "Done For You",
  done_with_you: "Done With You",
  done_by_you: "Done By You",
  hybrid: "Hybrid",
  free_tool: "Free Tool",
  paid_audit: "Paid Audit",
  strategy_session: "Strategy Session",
  productized_service: "Productized Service",
  membership_community: "Membership / Community",
  starter_offer: "Starter Offer",
  premium_offer: "Premium Offer",
};

export const BUYER_AWARENESS_STAGES = [
  "unaware",
  "problem_aware",
  "solution_aware",
  "offer_aware",
  "ready_to_buy",
] as const;
export type BuyerAwarenessStage = (typeof BUYER_AWARENESS_STAGES)[number];

export const BUYER_AWARENESS_LABELS: Record<BuyerAwarenessStage, string> = {
  unaware: "Unaware",
  problem_aware: "Problem aware",
  solution_aware: "Solution aware",
  offer_aware: "Offer aware",
  ready_to_buy: "Ready to buy",
};

export const EMOTIONAL_DRIVERS = [
  "stress_reduction",
  "more_leads",
  "more_booked_calls",
  "more_revenue",
  "more_confidence",
  "less_wasted_time",
  "easier_operations",
  "better_positioning",
] as const;
export type EmotionalDriver = (typeof EMOTIONAL_DRIVERS)[number];

export const EMOTIONAL_DRIVER_LABELS: Record<EmotionalDriver, string> = {
  stress_reduction: "Stress reduction",
  more_leads: "More leads",
  more_booked_calls: "More booked calls",
  more_revenue: "More revenue",
  more_confidence: "More confidence",
  less_wasted_time: "Less wasted time",
  easier_operations: "Easier operations",
  better_positioning: "Better positioning",
};

export const TRUST_BUILDER_TYPES = [
  "audit",
  "proof",
  "strategy_roadmap",
  "scorecard",
  "checklist",
  "demo",
  "sample",
  "custom_review",
] as const;
export type TrustBuilderType = (typeof TRUST_BUILDER_TYPES)[number];

export const TRUST_BUILDER_LABELS: Record<TrustBuilderType, string> = {
  audit: "Audit",
  proof: "Proof",
  strategy_roadmap: "Strategy roadmap",
  scorecard: "Scorecard",
  checklist: "Checklist",
  demo: "Demo",
  sample: "Sample",
  custom_review: "Custom review",
};

export const PRICING_MODELS = [
  "free",
  "one_time",
  "subscription",
  "milestone_based",
  "custom_quote",
] as const;
export type PricingModel = (typeof PRICING_MODELS)[number];

export const PRICING_MODEL_LABELS: Record<PricingModel, string> = {
  free: "Free",
  one_time: "One-time",
  subscription: "Subscription",
  milestone_based: "Milestone-based",
  custom_quote: "Custom quote",
};

export const RISK_REVERSAL_STYLES = [
  "none",
  "satisfaction_language",
  "milestone_confidence_language",
  "scoped_revision_promise",
] as const;
export type RiskReversalStyle = (typeof RISK_REVERSAL_STYLES)[number];

export const RISK_REVERSAL_LABELS: Record<RiskReversalStyle, string> = {
  none: "None",
  satisfaction_language: "Satisfaction language",
  milestone_confidence_language: "Milestone confidence language",
  scoped_revision_promise: "Scoped revision promise",
};

export const CTA_GOALS = [
  "book_call",
  "apply_now",
  "download_lead_magnet",
  "request_audit",
  "start_free_tool",
  "join_waitlist",
] as const;
export type CtaGoal = (typeof CTA_GOALS)[number];

export const CTA_GOAL_LABELS: Record<CtaGoal, string> = {
  book_call: "Book call",
  apply_now: "Apply now",
  download_lead_magnet: "Download lead magnet",
  request_audit: "Request audit",
  start_free_tool: "Start free tool",
  join_waitlist: "Join waitlist",
};

export const ASSET_STATUSES = [
  "draft",
  "internal_review",
  "approved",
  "active",
  "archived",
] as const;
export type OfferEngineAssetStatus = (typeof ASSET_STATUSES)[number];

export const ASSET_STATUS_LABELS: Record<OfferEngineAssetStatus, string> = {
  draft: "Draft",
  internal_review: "Internal review",
  approved: "Approved",
  active: "Active",
  archived: "Archived",
};

export const VISIBILITY_LEVELS = [
  "internal_only",
  "admin_approved_client_facing",
  "live_public",
] as const;
export type VisibilityLevel = (typeof VISIBILITY_LEVELS)[number];

export const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
  internal_only: "Internal only",
  admin_approved_client_facing: "Admin-approved client-facing",
  live_public: "Live public",
};

export const LEAD_MAGNET_ENGINE_TYPES = [
  "checklist",
  "scorecard",
  "audit",
  "quiz",
  "calculator",
  "mini_guide",
  "swipe_file",
  "template_pack",
  "short_training",
  "email_course",
  "diagnostic_tool",
  "script_pack",
  "worksheet",
  "planner",
  "comparison_guide",
  "mistakes_guide",
  "roadmap",
  "case_study_pdf",
] as const;
export type LeadMagnetEngineType = (typeof LEAD_MAGNET_ENGINE_TYPES)[number];

export const LEAD_MAGNET_TYPE_LABELS: Record<LeadMagnetEngineType, string> = {
  checklist: "Checklist",
  scorecard: "Scorecard",
  audit: "Audit",
  quiz: "Quiz",
  calculator: "Calculator",
  mini_guide: "Mini-guide",
  swipe_file: "Swipe file",
  template_pack: "Template pack",
  short_training: "Short training",
  email_course: "Email course",
  diagnostic_tool: "Diagnostic tool",
  script_pack: "Script pack",
  worksheet: "Worksheet",
  planner: "Planner",
  comparison_guide: "Comparison guide",
  mistakes_guide: "Mistakes guide",
  roadmap: "Roadmap",
  case_study_pdf: "Case-study style PDF",
};

export const LEAD_MAGNET_FORMATS = [
  "pdf",
  "interactive_tool",
  "email_sequence",
  "landing_page",
  "quiz",
  "downloadable_template",
  "embedded_calculator",
] as const;
export type LeadMagnetFormat = (typeof LEAD_MAGNET_FORMATS)[number];

export const LEAD_MAGNET_FORMAT_LABELS: Record<LeadMagnetFormat, string> = {
  pdf: "PDF",
  interactive_tool: "Interactive tool",
  email_sequence: "Email sequence",
  landing_page: "Landing page",
  quiz: "Quiz",
  downloadable_template: "Downloadable template",
  embedded_calculator: "Embedded calculator",
};

export const DELIVERY_METHODS = [
  "email",
  "on_page",
  "crm_delivery",
  "dashboard_unlock",
] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  email: "Email",
  on_page: "On-page",
  crm_delivery: "CRM delivery",
  dashboard_unlock: "Dashboard unlock",
};

export const TRUST_PURPOSES = [
  "educate",
  "diagnose",
  "qualify",
  "build_urgency",
  "prove_expertise",
  "segment_leads",
] as const;
export type TrustPurpose = (typeof TRUST_PURPOSES)[number];

export const TRUST_PURPOSE_LABELS: Record<TrustPurpose, string> = {
  educate: "Educate",
  diagnose: "Diagnose",
  qualify: "Qualify",
  build_urgency: "Build urgency",
  prove_expertise: "Prove expertise",
  segment_leads: "Segment leads",
};

export const QUALIFICATION_INTENTS = [
  "top_of_funnel",
  "warm_lead_filter",
  "sales_readiness_check",
] as const;
export type QualificationIntent = (typeof QUALIFICATION_INTENTS)[number];

export const QUALIFICATION_INTENT_LABELS: Record<QualificationIntent, string> = {
  top_of_funnel: "Top of funnel",
  warm_lead_filter: "Warm lead filter",
  sales_readiness_check: "Sales readiness check",
};

export const SCORE_TIERS = ["weak", "fair", "strong", "high_potential"] as const;
export type ScoreTier = (typeof SCORE_TIERS)[number];

export const SCORE_TIER_LABELS: Record<ScoreTier, string> = {
  weak: "Weak",
  fair: "Fair",
  strong: "Strong",
  high_potential: "High potential",
};

export const FUNNEL_STAGES = [
  "top",
  "middle",
  "bottom",
  "post_purchase",
] as const;
export type FunnelStageHint = (typeof FUNNEL_STAGES)[number];

export const FUNNEL_STAGE_LABELS: Record<FunnelStageHint, string> = {
  top: "Top of funnel",
  middle: "Middle",
  bottom: "Bottom",
  post_purchase: "Post-purchase",
};
