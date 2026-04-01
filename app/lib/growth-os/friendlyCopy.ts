import type { DataVisibilityTier } from "@shared/accessScope";

/** Shown in selects and help text — API still uses snake_case tier keys. */
export const DATA_VISIBILITY_LABELS: Record<DataVisibilityTier, string> = {
  internal_only: "Team only — not for clients or public pages",
  client_visible: "Client-safe — OK to share with a customer",
  public_visible: "Public — OK on open web pages",
};

export interface ResourceKindPreset {
  /** Value sent to APIs (unchanged for compatibility). */
  value: string;
  /** Short label for dropdowns. */
  label: string;
  /** One-line hint for placeholders / help. */
  hint: string;
  /** Example resource id for autofill suggestions. */
  exampleId: string;
}

/** What you are attaching an internal note to (stored as resource type + id). */
export const NOTE_RESOURCE_PRESETS: ResourceKindPreset[] = [
  {
    value: "foundation",
    label: "Core Growth OS setup",
    hint: "Workspace-wide foundation record.",
    exampleId: "main",
  },
  {
    value: "growth_report",
    label: "Growth report",
    hint: "A saved or exported growth report.",
    exampleId: "q1-2026",
  },
  {
    value: "growth_diagnosis",
    label: "Growth diagnosis",
    hint: "Funnel or diagnosis workflow output.",
    exampleId: "client-acme-jan",
  },
  {
    value: "audit_run",
    label: "Funnel audit run",
    hint: "One run from Internal audit.",
    exampleId: "run-42",
  },
  {
    value: "content_document",
    label: "Content Studio document",
    hint: "A draft or post in Content Studio (often a numeric id).",
    exampleId: "128",
  },
];

/** Visibility override target — same string keys as stored in the database. */
export const VISIBILITY_OVERRIDE_PRESETS: ResourceKindPreset[] = [
  {
    value: "growth_report",
    label: "Growth report",
    hint: "Overrides who may see this report.",
    exampleId: "quarterly-summary",
  },
  {
    value: "growth_diagnosis",
    label: "Growth diagnosis",
    hint: "Diagnosis or playbook tied to a client.",
    exampleId: "acme-2026",
  },
  {
    value: "client_safe_share",
    label: "Client share record",
    hint: "A generated share / token row.",
    exampleId: "share-001",
  },
  {
    value: "foundation",
    label: "Core setup",
    hint: "Rare — only if you version foundation rows.",
    exampleId: "main",
  },
];

/** Client share form — what the summary is “about”. */
export const SHARE_RESOURCE_PRESETS: ResourceKindPreset[] = [
  {
    value: "growth_diagnosis",
    label: "Growth diagnosis (client summary)",
    hint: "Typical for a diagnosis or playbook snapshot.",
    exampleId: "client-acme-jan",
  },
  {
    value: "growth_report",
    label: "Growth report",
    hint: "High-level report your client can open.",
    exampleId: "q1-2026",
  },
  {
    value: "audit_run",
    label: "Audit highlights",
    hint: "Sanitized highlights from an audit run.",
    exampleId: "run-42",
  },
];

const AUDIT_ACTION_LABELS: Record<string, string> = {
  client_safe_share_created: "Client share link created",
  internal_note_created: "Internal team note saved",
  entity_visibility_upserted: "Visibility rule updated (who can see what)",
  client_safe_built_share_created: "Policy-based client share created",
  client_safe_report_viewed: "Someone opened a client share link",
};

/** Turn `weekly_research_digest` into “Weekly research digest”. */
export function humanizeSnakeCase(raw: string): string {
  if (!raw.trim()) return raw;
  return raw
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function formatGosAuditAction(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? humanizeSnakeCase(action);
}

const RESEARCH_KIND_HINTS: Record<string, string> = {
  keyword: "Search keyword",
  topic: "Broad topic",
  phrase: "Phrase or angle",
  headline: "Headline idea",
  mixed: "Mixed discovery",
};

export function formatResearchItemKind(kind: string): string {
  return RESEARCH_KIND_HINTS[kind] ?? humanizeSnakeCase(kind);
}

const SOURCE_LABELS: Record<string, string> = {
  openai: "Live AI",
  mock_catalog: "Demo data (no API)",
};

export function formatResearchSource(source: string): string {
  if (source.includes("mock")) return SOURCE_LABELS.mock_catalog;
  return SOURCE_LABELS[source] ?? humanizeSnakeCase(source);
}

export const AUTOMATION_JOB_LABELS: Record<string, string> = {
  weekly_research_digest: "Weekly research email-style digest",
  audit_recommendation_engine: "Turn audit findings into next steps",
  editorial_gap_detection: "Find missing topics in your content plan",
  stale_content_detection: "Flag old posts that may need a refresh",
  stale_followup_detection: "Flag CRM follow-ups that went cold",
  content_insight_save: "Run AI review when a document is saved",
  content_insight_schedule: "Run AI review when something is scheduled",
  headline_hook_variants: "Generate headline and hook options",
  repurposing_suggestions: "Suggest repurposing for other channels",
};

export function formatAutomationJobType(jobType: string): string {
  return AUTOMATION_JOB_LABELS[jobType] ?? humanizeSnakeCase(jobType);
}

const RESEARCH_DATA_MODE_LABELS: Record<string, string> = {
  mixed_or_live: "Includes live AI discovery",
  mock_or_cached: "Demo or cached items only (no live API rows this week)",
};

/** Weekly summary `dataMode` from the research API. */
export function formatResearchDataMode(mode: string | undefined): string {
  if (!mode) return "—";
  return RESEARCH_DATA_MODE_LABELS[mode] ?? humanizeSnakeCase(mode);
}

const AUTOMATION_RUN_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

export function formatAutomationRunStatus(status: string): string {
  return AUTOMATION_RUN_STATUS_LABELS[status] ?? humanizeSnakeCase(status);
}

const CMS_CONTENT_TYPE_LABELS: Record<string, string> = {
  headline: "Headline",
  hook: "Hook",
  cta: "CTA / button copy",
  social_caption: "Social caption",
  blog: "Blog draft",
  script: "Script",
  email: "Email",
  announcement: "Announcement",
  learning_lesson: "Lesson",
};

/** Content Studio `content_type` values shown on intelligence dashboards. */
export function formatCmsContentType(contentType: string | null | undefined): string {
  if (contentType == null || contentType === "") return "—";
  return CMS_CONTENT_TYPE_LABELS[contentType] ?? humanizeSnakeCase(contentType);
}

const FUNNEL_STAGE_LABELS: Record<string, string> = {
  unset: "Not set",
  awareness: "Awareness",
  consideration: "Consideration",
  conversion: "Conversion",
  nurture: "Nurture",
  retention: "Retention",
};

export function formatFunnelStage(stage: string): string {
  return FUNNEL_STAGE_LABELS[stage] ?? humanizeSnakeCase(stage);
}

const CONTENT_ATTRIBUTION_KIND_LABELS: Record<string, string> = {
  internal_document: "Content Studio document",
  blog_post: "Blog post",
  calendar_entry: "Editorial calendar entry",
};

export function formatContentAttributionKind(kind: string): string {
  return CONTENT_ATTRIBUTION_KIND_LABELS[kind] ?? humanizeSnakeCase(kind);
}

/** Stable order for automation job dropdown (values must match API). */
export const AUTOMATION_JOB_VALUES = [
  "weekly_research_digest",
  "audit_recommendation_engine",
  "editorial_gap_detection",
  "stale_content_detection",
  "stale_followup_detection",
  "content_insight_save",
  "content_insight_schedule",
  "headline_hook_variants",
  "repurposing_suggestions",
] as const;

export function presetByValue(
  presets: ResourceKindPreset[],
  value: string,
): ResourceKindPreset | undefined {
  return presets.find((p) => p.value === value);
}

const ALL_KNOWN_RESOURCE_PRESETS: ResourceKindPreset[] = [
  ...NOTE_RESOURCE_PRESETS,
  ...VISIBILITY_OVERRIDE_PRESETS,
  ...SHARE_RESOURCE_PRESETS,
];

/** Map stored API value to a short English label when we know it. */
export function labelForStoredResourceType(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  const p = ALL_KNOWN_RESOURCE_PRESETS.find((x) => x.value === value);
  return p?.label ?? humanizeSnakeCase(value);
}
