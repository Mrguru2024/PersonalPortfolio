/**
 * Writes AEE CRM attribution events for closed-loop experiment reporting.
 */
import { db } from "@server/db";
import { aeeCrmAttributionEvents, growthExperiments, growthVariants } from "@shared/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import type { FormAttribution } from "@server/services/leadFromFormService";

export type AeeResolvedExperiment = {
  experimentId: number;
  variantId: number;
};

export function parseAeeFromFormAttribution(
  attribution: FormAttribution | null | undefined,
): { experimentId?: number; variantId?: number; experimentKey?: string; variantKey?: string } {
  if (!attribution) return {};
  const a = attribution as FormAttribution & Record<string, unknown>;
  const experimentKey =
    (typeof a.experimentKey === "string" ? a.experimentKey.trim() : "") ||
    (typeof a.experiment_key === "string" ? a.experiment_key.trim() : "") ||
    undefined;
  const variantKey =
    (typeof a.variantKey === "string" ? a.variantKey.trim() : "") ||
    (typeof a.variant_key === "string" ? a.variant_key.trim() : "") ||
    undefined;
  let experimentId: number | undefined;
  let variantId: number | undefined;
  const eid = a.experimentId ?? a.experiment_id;
  const vid = a.variantId ?? a.variant_id;
  if (typeof eid === "number" && Number.isFinite(eid)) experimentId = eid;
  else if (typeof eid === "string" && eid.trim()) {
    const n = Number.parseInt(eid, 10);
    if (Number.isFinite(n)) experimentId = n;
  }
  if (typeof vid === "number" && Number.isFinite(vid)) variantId = vid;
  else if (typeof vid === "string" && vid.trim()) {
    const n = Number.parseInt(vid, 10);
    if (Number.isFinite(n)) variantId = n;
  }
  return { experimentKey, variantKey, experimentId, variantId };
}

export async function recordAeeCrmAttributionEvent(input: {
  workspaceKey?: string;
  contactId: number;
  dealId?: number | null;
  visitorId?: string | null;
  experimentId: number | null;
  variantId: number | null;
  eventKind: string;
  valueCents?: number;
  metadataJson?: Record<string, unknown>;
  occurredAt?: Date;
}): Promise<void> {
  if (input.experimentId == null || input.variantId == null) return;
  const ws = input.workspaceKey ?? "ascendra_main";
  await db.insert(aeeCrmAttributionEvents).values({
    workspaceKey: ws,
    contactId: input.contactId,
    dealId: input.dealId ?? null,
    visitorId: input.visitorId?.trim() || null,
    experimentId: input.experimentId,
    variantId: input.variantId,
    eventKind: input.eventKind,
    valueCents: input.valueCents ?? 0,
    metadataJson: input.metadataJson ?? {},
    occurredAt: input.occurredAt ?? new Date(),
  });
}

/** Resolve experiment + variant ids from attribution; requires DB lookup by key when ids missing. */
export async function resolveAeeExperimentVariantForAttribution(
  attribution: FormAttribution | null | undefined,
): Promise<AeeResolvedExperiment | null> {
  const parsed = parseAeeFromFormAttribution(attribution);

  let experimentId = parsed.experimentId ?? null;
  let variantId = parsed.variantId ?? null;

  if (experimentId == null && parsed.experimentKey) {
    const [e] = await db
      .select({ id: growthExperiments.id })
      .from(growthExperiments)
      .where(eq(growthExperiments.key, parsed.experimentKey))
      .limit(1);
    experimentId = e?.id ?? null;
  }

  if (experimentId == null) return null;

  if (variantId == null && parsed.variantKey) {
    const [v] = await db
      .select({ id: growthVariants.id })
      .from(growthVariants)
      .where(and(eq(growthVariants.experimentId, experimentId), eq(growthVariants.key, parsed.variantKey)))
      .limit(1);
    variantId = v?.id ?? null;
  }

  if (variantId == null) {
    const [v] = await db
      .select({ id: growthVariants.id })
      .from(growthVariants)
      .where(eq(growthVariants.experimentId, experimentId))
      .orderBy(asc(growthVariants.id))
      .limit(1);
    variantId = v?.id ?? null;
  }

  if (variantId == null) return null;
  return { experimentId, variantId };
}

/** Latest experiment/variant attributed to this contact (any event kind). */
export async function getLatestAeeAttributionForContact(
  contactId: number,
): Promise<{ experimentId: number; variantId: number } | null> {
  const [row] = await db
    .select({
      experimentId: aeeCrmAttributionEvents.experimentId,
      variantId: aeeCrmAttributionEvents.variantId,
    })
    .from(aeeCrmAttributionEvents)
    .where(eq(aeeCrmAttributionEvents.contactId, contactId))
    .orderBy(desc(aeeCrmAttributionEvents.occurredAt))
    .limit(1);
  if (row?.experimentId == null || row?.variantId == null) return null;
  return { experimentId: row.experimentId, variantId: row.variantId };
}
