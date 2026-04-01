import { z } from "zod";

/** Optional per-slot content strategy — extends calendar rows without replacing funnel/persona/CTA fields. */
export type EditorialStrategyMeta = {
  contentPillarId?: string;
  primaryKeyword?: string;
  searchIntent?: "informational" | "commercial" | "transactional" | "navigational" | "";
  contentFormat?: string;
  lifecycle?: "evergreen" | "campaign" | "timely";
  successKpi?: string;
  hookAngle?: string;
  repurposeTargets?: string[];
  internalNotes?: string;
};

export const editorialStrategyMetaSchema = z
  .object({
    contentPillarId: z.string().max(120).optional(),
    primaryKeyword: z.string().max(200).optional(),
    searchIntent: z
      .enum(["informational", "commercial", "transactional", "navigational", ""])
      .optional(),
    contentFormat: z.string().max(120).optional(),
    lifecycle: z.enum(["evergreen", "campaign", "timely"]).optional(),
    successKpi: z.string().max(500).optional(),
    hookAngle: z.string().max(2000).optional(),
    repurposeTargets: z.array(z.string().max(80)).max(20).optional(),
    internalNotes: z.string().max(4000).optional(),
  })
  .strict();

export type EditorialStrategyMetaInput = z.infer<typeof editorialStrategyMetaSchema>;

export function normalizeEditorialStrategyMeta(raw: unknown): EditorialStrategyMeta | null {
  if (raw == null || (typeof raw === "object" && raw !== null && Object.keys(raw).length === 0)) {
    return null;
  }
  const parsed = editorialStrategyMetaSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data as EditorialStrategyMeta;
}

/** Validate with Zod, then drop empty strings so null-ish clears don’t linger in JSON. */
export function sanitizeEditorialStrategyMetaForDb(raw: unknown): EditorialStrategyMeta | null {
  if (raw === null) return null;
  const parsed = editorialStrategyMetaSchema.safeParse(raw);
  if (!parsed.success) return null;
  const d = parsed.data;
  const out: EditorialStrategyMeta = {};
  if (d.contentPillarId?.trim()) out.contentPillarId = d.contentPillarId.trim();
  if (d.primaryKeyword?.trim()) out.primaryKeyword = d.primaryKeyword.trim();
  if (d.searchIntent) out.searchIntent = d.searchIntent;
  if (d.contentFormat?.trim()) out.contentFormat = d.contentFormat.trim();
  if (d.lifecycle) out.lifecycle = d.lifecycle;
  if (d.successKpi?.trim()) out.successKpi = d.successKpi.trim();
  if (d.hookAngle?.trim()) out.hookAngle = d.hookAngle.trim();
  if (d.repurposeTargets?.length) out.repurposeTargets = [...d.repurposeTargets];
  if (d.internalNotes?.trim()) out.internalNotes = d.internalNotes.trim();
  return Object.keys(out).length > 0 ? out : null;
}
