import { z } from "zod";
import type { FormAttribution } from "@server/services/leadFromFormService";

const trimmed = z.string().trim();

/** Optional experiment/variant fields accepted on public lead APIs (snake_case aliases omitted — use camelCase in JSON). */
export const zOptionalAeeAttribution = z.object({
  experimentKey: trimmed.max(120).optional().nullable(),
  variantKey: trimmed.max(120).optional().nullable(),
  experimentId: z.union([z.number().int(), trimmed.max(32)]).optional().nullable(),
  variantId: z.union([z.number().int(), trimmed.max(32)]).optional().nullable(),
});

export type OptionalAeeAttribution = z.infer<typeof zOptionalAeeAttribution>;

export function aeeFieldsForFormAttribution(
  a: OptionalAeeAttribution | null | undefined,
): Partial<FormAttribution> {
  if (!a) return {};
  const out: Partial<FormAttribution> = {};
  if (a.experimentKey?.trim()) out.experimentKey = a.experimentKey.trim();
  if (a.variantKey?.trim()) out.variantKey = a.variantKey.trim();
  if (a.experimentId != null && a.experimentId !== "") out.experimentId = a.experimentId;
  if (a.variantId != null && a.variantId !== "") out.variantId = a.variantId;
  return out;
}
