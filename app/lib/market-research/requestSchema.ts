import { z } from "zod";
import { MARKET_RESEARCH_SOURCE_KEYS } from "@shared/marketResearchConstants";

const sourceKeyEnum = z.enum(MARKET_RESEARCH_SOURCE_KEYS);

const csvTextToArray = (value: string): string[] =>
  value
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean);

export const marketResearchProjectCreateSchema = z
  .object({
    projectKey: z.string().max(120).optional(),
    name: z.string().min(1).max(180),
    industry: z.string().min(1).max(180),
    niche: z.string().min(1).max(180),
    service: z.string().max(180).optional().default(""),
    location: z.string().max(180).optional().default(""),
    keywords: z.union([z.array(z.string()), z.string()]).optional().default([]),
    competitors: z.union([z.array(z.string()), z.string()]).optional().default([]),
    subreddits: z.union([z.array(z.string()), z.string()]).optional().default([]),
    sourcesEnabled: z.array(sourceKeyEnum).min(1),
    notes: z.string().max(20000).optional().default(""),
  })
  .superRefine((input, ctx) => {
    const keywords = Array.isArray(input.keywords) ? input.keywords : csvTextToArray(input.keywords);
    const competitors = Array.isArray(input.competitors)
      ? input.competitors
      : csvTextToArray(input.competitors);
    const hasService = input.service.trim().length > 0;
    if (!hasService && keywords.length === 0 && competitors.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one of service, keywords, or competitors.",
        path: ["service"],
      });
    }
  });

export type MarketResearchProjectCreateBody = z.infer<typeof marketResearchProjectCreateSchema>;

export const marketResearchProjectUpdateSchema = z
  .object({
    projectKey: z.string().max(120).optional(),
    name: z.string().min(1).max(180).optional(),
    industry: z.string().min(1).max(180).optional(),
    niche: z.string().min(1).max(180).optional(),
    service: z.string().max(180).optional(),
    location: z.string().max(180).optional(),
    keywords: z.union([z.array(z.string()), z.string()]).optional(),
    competitors: z.union([z.array(z.string()), z.string()]).optional(),
    subreddits: z.union([z.array(z.string()), z.string()]).optional(),
    sourcesEnabled: z.array(sourceKeyEnum).min(1).optional(),
    notes: z.string().max(20000).optional(),
    status: z.enum(["draft", "active", "archived"]).optional(),
  })
  .superRefine((input, ctx) => {
    if (input.service == null && input.keywords == null && input.competitors == null) return;
    const keywords =
      input.keywords == null ? [] : Array.isArray(input.keywords) ? input.keywords : csvTextToArray(input.keywords);
    const competitors =
      input.competitors == null
        ? []
        : Array.isArray(input.competitors)
          ? input.competitors
          : csvTextToArray(input.competitors);
    const hasService = (input.service ?? "").trim().length > 0;
    if (!hasService && keywords.length === 0 && competitors.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one of service, keywords, or competitors when updating intake.",
        path: ["service"],
      });
    }
  });

export type MarketResearchProjectUpdateBody = z.infer<typeof marketResearchProjectUpdateSchema>;

export const marketResearchRunBodySchema = z.object({
  triggerType: z.enum(["manual", "rerun", "compare"]).optional(),
});

export const marketResearchManualEntryBodySchema = z.object({
  runId: z.number().int().positive().optional(),
  entryType: z.string().min(1).max(80).optional(),
  content: z.string().min(1).max(20000),
  tags: z.union([z.array(z.string()), z.string()]).optional().default([]),
  referenceUrl: z.string().url().optional().or(z.literal("")),
});

export type MarketResearchManualEntryBody = z.infer<typeof marketResearchManualEntryBodySchema>;

export const marketResearchSourceConfigUpdateSchema = z.object({
  projectKey: z.string().max(120).optional(),
  sourceKey: sourceKeyEnum,
  enabled: z.boolean().optional(),
  fallbackEnabled: z.boolean().optional(),
  setupStatus: z.enum(["configured", "partial", "not_configured"]).optional(),
  checklistJson: z.array(z.string()).optional(),
  configJson: z.record(z.string(), z.unknown()).optional(),
});

export const marketResearchSourceTestSchema = z.object({
  projectKey: z.string().max(120).optional(),
});

export function normalizeStringList(value: string[] | string | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return csvTextToArray(value);
  }
  return [];
}
