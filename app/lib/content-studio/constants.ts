/** Internal CMS document types (not public blog — editorial / library). */
export const INTERNAL_CMS_CONTENT_TYPES = [
  "blog_draft",
  "short_form",
  "micro_post",
  "social_caption",
  "newsletter_draft",
  "lead_magnet_draft",
  "landing_copy",
  "campaign_brief",
  "hook",
  "headline",
  "cta",
] as const;

export type InternalCmsContentType = (typeof INTERNAL_CMS_CONTENT_TYPES)[number];

export const WORKFLOW_STATUSES = [
  "draft",
  "staged",
  "scheduled",
  "published",
  "failed",
  "archived",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export const CALENDAR_STATUSES = ["draft", "scheduled", "published", "skipped"] as const;

/**
 * Preset funnel stages for Content Studio (documents + editorial calendar).
 * Aligns with Growth OS experiments / intelligence mix reports.
 */
export const CONTENT_STUDIO_FUNNEL_STAGES = [
  "awareness",
  "consideration",
  "conversion",
  "nurture",
] as const;

export type ContentStudioFunnelStage = (typeof CONTENT_STUDIO_FUNNEL_STAGES)[number];

/** Select sentinel — not persisted */
export const CONTENT_STUDIO_FUNNEL_STAGE_UNSET = "__funnel_unset__" as const;
