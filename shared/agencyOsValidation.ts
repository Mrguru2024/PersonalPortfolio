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

/** Slug must exist in registry (custom or built-in). */
export function isKnownCanonicalHvdSlug(slug: string): boolean {
  return (AOS_HVD_CATEGORY_SLUGS as readonly string[]).includes(slug);
}
