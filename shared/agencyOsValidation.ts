import { z } from "zod";
import { AOS_HVD_CATEGORY_SLUGS } from "./agencyOsSchema";

const slugRegex = /^[a-z][a-z0-9_]{1,63}$/;

const VALUE_CONTRIBUTION_KEYS = [
  "leads",
  "conversions",
  "revenue",
  "retention",
  "efficiency",
  "visibility",
  "training",
] as const;

export const agencyOsHvdSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .refine((s) => slugRegex.test(s), "Slug: lowercase letters, numbers, underscores; start with a letter.");

export const agencyOsHvdRegistryCreateSchema = z.object({
  slug: agencyOsHvdSlugSchema,
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).optional().nullable(),
  defaultOutcomeHints: z.string().trim().max(8000).optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export const agencyOsHvdRegistryUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(4000).optional().nullable(),
  defaultOutcomeHints: z.string().trim().max(8000).optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

const valueContribSchema = z
  .array(z.enum(VALUE_CONTRIBUTION_KEYS))
  .min(1, "Select at least one value contribution (leads, conversions, revenue, …).");

export const agencyOsProjectCreateSchema = z.object({
  name: z.string().trim().min(1).max(300),
  description: z.string().trim().max(8000).optional().nullable(),
  status: z.enum(["draft", "planning", "active", "on_hold", "completed", "cancelled"]).optional(),
  primaryHvdSlug: agencyOsHvdSlugSchema,
  secondaryHvdSlugs: z.array(agencyOsHvdSlugSchema).max(12).optional().default([]),
  valueContributions: valueContribSchema,
  expectedOutcome: z.string().trim().min(1).max(4000),
  impactMetric: z.string().trim().min(1).max(2000),
  dataSource: z.string().trim().min(1).max(2000),
  priority: z.enum(["low", "medium", "high", "critical"]).optional().default("medium"),
  ownerUserIds: z.array(z.number().int().positive()).max(50).optional().default([]),
  linkedCrmAccountId: z.number().int().positive().optional().nullable(),
  linkedCrmContactId: z.number().int().positive().optional().nullable(),
  linkedCrmDealId: z.number().int().positive().optional().nullable(),
  linkedAgreementId: z.number().int().positive().optional().nullable(),
});

export type AgencyOsProjectCreateInput = z.infer<typeof agencyOsProjectCreateSchema>;

export const agencyOsTaskCreateSchema = z.object({
  projectId: z.number().int().positive().optional().nullable(),
  milestoneId: z.number().int().positive().optional().nullable(),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(8000).optional().nullable(),
  executionRoleId: z.number().int().positive().optional().nullable(),
  assigneeUserId: z.number().int().positive(),
  primaryHvdSlug: agencyOsHvdSlugSchema,
  secondaryHvdSlugs: z.array(agencyOsHvdSlugSchema).max(12).optional().default([]),
  valueContributions: valueContribSchema,
  expectedOutcome: z.string().trim().min(1).max(4000),
  impactMetric: z.string().trim().min(1).max(2000),
  expectedOutput: z.string().trim().max(4000).optional().nullable(),
  sopId: z.number().int().positive().optional().nullable(),
  playbookId: z.number().int().positive().optional().nullable(),
  /** ISO date string or empty */
  dueAt: z.string().max(40).optional().nullable(),
});

export type AgencyOsTaskCreateInput = z.infer<typeof agencyOsTaskCreateSchema>;

export const agencyOsProjectPatchSchema = z.object({
  name: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().max(8000).optional().nullable(),
  status: z.enum(["draft", "planning", "active", "on_hold", "completed", "cancelled"]).optional(),
  health: z.enum(["on_track", "at_risk", "blocked"]).optional().nullable(),
  progressPercent: z.number().int().min(0).max(100).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  ownerUserIds: z.array(z.number().int().positive()).max(50).optional(),
});

export type AgencyOsProjectPatchInput = z.infer<typeof agencyOsProjectPatchSchema>;

export const agencyOsPhaseCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).optional().nullable(),
  orderIndex: z.number().int().min(0).max(999).optional(),
});

export type AgencyOsPhaseCreateInput = z.infer<typeof agencyOsPhaseCreateSchema>;

export const agencyOsMilestoneCreateSchema = z.object({
  phaseId: z.number().int().positive().optional().nullable(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).optional().nullable(),
  dueAt: z.string().max(40).optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export type AgencyOsMilestoneCreateInput = z.infer<typeof agencyOsMilestoneCreateSchema>;

export const agencyOsMilestonePatchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(4000).optional().nullable(),
  dueAt: z.string().max(40).optional().nullable(),
  status: z.enum(["pending", "in_progress", "done", "skipped"]).optional(),
  approvalState: z.enum(["none", "pending", "approved", "rejected"]).optional().nullable(),
  isBlocked: z.boolean().optional(),
  phaseId: z.number().int().positive().optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export type AgencyOsMilestonePatchInput = z.infer<typeof agencyOsMilestonePatchSchema>;

const sopStepSchema = z.object({
  title: z.string().trim().min(1).max(500),
  detail: z.string().trim().max(8000).optional(),
});

export const agencyOsSopCreateSchema = z.object({
  title: z.string().trim().min(1).max(300),
  purpose: z.string().trim().min(1).max(8000),
  executionRoleId: z.number().int().positive().optional().nullable(),
  primaryHvdSlug: agencyOsHvdSlugSchema.optional().nullable(),
  tools: z.array(z.string().trim().min(1).max(200)).max(50).optional().default([]),
  steps: z.array(sopStepSchema).max(100).optional().default([]),
  mistakes: z.array(z.string().trim().max(2000)).max(100).optional().default([]),
  qaChecklist: z.array(z.string().trim().max(2000)).max(100).optional().default([]),
  successCriteria: z.string().trim().max(8000).optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).optional().default("draft"),
});

export const agencyOsSopUpdateSchema = agencyOsSopCreateSchema.partial();

export type AgencyOsSopCreateInput = z.infer<typeof agencyOsSopCreateSchema>;
export type AgencyOsSopUpdateInput = z.infer<typeof agencyOsSopUpdateSchema>;

const playbookStepSchema = z.object({
  title: z.string().trim().min(1).max(500),
  body: z.string().trim().max(16000).optional(),
  suggestedTaskTitle: z.string().trim().max(300).optional(),
});

export const agencyOsPlaybookCreateSchema = z.object({
  slug: agencyOsHvdSlugSchema,
  title: z.string().trim().min(1).max(300),
  purpose: z.string().trim().max(8000).optional().nullable(),
  primaryHvdSlug: agencyOsHvdSlugSchema.optional().nullable(),
  steps: z.array(playbookStepSchema).max(200).optional().default([]),
});

export const agencyOsPlaybookUpdateSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  purpose: z.string().trim().max(8000).optional().nullable(),
  primaryHvdSlug: agencyOsHvdSlugSchema.optional().nullable(),
  steps: z.array(playbookStepSchema).max(200).optional(),
});

export type AgencyOsPlaybookCreateInput = z.infer<typeof agencyOsPlaybookCreateSchema>;
export type AgencyOsPlaybookUpdateInput = z.infer<typeof agencyOsPlaybookUpdateSchema>;

export const agencyOsTrainingCreateSchema = z.object({
  slug: agencyOsHvdSlugSchema,
  title: z.string().trim().min(1).max(300),
  summary: z.string().trim().max(8000).optional().nullable(),
  contentJson: z.record(z.string(), z.unknown()),
  filterRoleKey: z.string().trim().max(64).optional().nullable(),
  filterHvdSlug: agencyOsHvdSlugSchema.optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  isPublished: z.boolean().optional(),
});

export const agencyOsTrainingUpdateSchema = agencyOsTrainingCreateSchema.partial();

export type AgencyOsTrainingCreateInput = z.infer<typeof agencyOsTrainingCreateSchema>;
export type AgencyOsTrainingUpdateInput = z.infer<typeof agencyOsTrainingUpdateSchema>;

export const agencyOsExecutionRoleCreateSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .refine((s) => /^[a-z][a-z0-9_]*$/.test(s), "Key: lowercase, numbers, underscores"),
  label: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).optional().nullable(),
  responsibilities: z.array(z.string().trim().max(500)).max(50).optional().default([]),
  taskTypes: z.array(z.string().trim().max(120)).max(50).optional().default([]),
  systemsUsed: z.array(z.string().trim().max(120)).max(50).optional().default([]),
  aiFocus: z.string().trim().max(4000).optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export const agencyOsExecutionRoleUpdateSchema = agencyOsExecutionRoleCreateSchema.omit({ key: true }).partial();

export type AgencyOsExecutionRoleCreateInput = z.infer<typeof agencyOsExecutionRoleCreateSchema>;
export type AgencyOsExecutionRoleUpdateInput = z.infer<typeof agencyOsExecutionRoleUpdateSchema>;

export const agencyOsUserRolesSetSchema = z.object({
  userId: z.number().int().positive(),
  roleIds: z.array(z.number().int().positive()).max(50),
});

export type AgencyOsUserRolesSetInput = z.infer<typeof agencyOsUserRolesSetSchema>;

/** Slug must exist in registry (custom or built-in). */
export function isKnownCanonicalHvdSlug(slug: string): boolean {
  return (AOS_HVD_CATEGORY_SLUGS as readonly string[]).includes(slug);
}
