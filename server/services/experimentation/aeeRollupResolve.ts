/**
 * Resolve growth experiment / variant ids from visitor_activity.metadata JSON.
 */
export type ExperimentVariantMaps = {
  byExperimentKey: Map<string, { experimentId: number; workspaceKey: string }>;
  byExperimentId: Map<number, { experimentId: number; workspaceKey: string }>;
  variantsByExperimentId: Map<number, Map<string, number>>;
};

export type ResolvedVisitorAee = {
  workspaceKey: string;
  experimentId: number;
  variantId: number;
  dimensionKeys: string[];
};

function metaRecord(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

function str(meta: Record<string, unknown>, k: string): string {
  const v = meta[k];
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  return "";
}

/** Build dimension keys: total + optional persona + region slices. */
export function buildDimensionKeys(meta: Record<string, unknown>, visitorRegion: string | null): string[] {
  const keys = new Set<string>(["total"]);
  const persona = str(meta, "persona_key");
  if (persona) keys.add(`persona:${persona}`);
  const mreg = str(meta, "market_region");
  const reg = mreg || (visitorRegion?.trim() ?? "");
  if (reg) keys.add(`region:${reg}`);
  return [...keys];
}

export function resolveAeeIdsFromVisitorMeta(
  metadata: unknown,
  maps: ExperimentVariantMaps,
  visitorRegion: string | null = null,
): ResolvedVisitorAee | null {
  const m = metaRecord(metadata);
  const ek = str(m, "experiment_key");
  let experimentId: number | null = null;
  let workspaceKey = "ascendra_main";

  const eidRaw = m.experiment_id;
  if (typeof eidRaw === "number" && Number.isFinite(eidRaw)) experimentId = eidRaw;
  else if (typeof eidRaw === "string" && eidRaw.trim()) {
    const n = Number.parseInt(eidRaw, 10);
    if (Number.isFinite(n)) experimentId = n;
  }

  if (experimentId == null && ek) {
    const row = maps.byExperimentKey.get(ek);
    if (row) {
      experimentId = row.experimentId;
      workspaceKey = row.workspaceKey;
    }
  } else if (experimentId != null) {
    const row = maps.byExperimentId.get(experimentId);
    if (row) workspaceKey = row.workspaceKey;
    else experimentId = null;
  }

  if (experimentId == null) return null;

  let variantId: number | null = null;
  const vk = str(m, "variant_key");
  const vidRaw = m.variant_id;
  if (typeof vidRaw === "number" && Number.isFinite(vidRaw)) variantId = vidRaw;
  else if (typeof vidRaw === "string" && String(vidRaw).trim()) {
    const n = Number.parseInt(String(vidRaw), 10);
    if (Number.isFinite(n)) variantId = n;
  }
  if (variantId == null && vk) {
    const vmap = maps.variantsByExperimentId.get(experimentId);
    variantId = vmap?.get(vk) ?? null;
  }
  if (variantId == null) {
    const vmap = maps.variantsByExperimentId.get(experimentId);
    if (vmap && vmap.size) {
      variantId = vmap.values().next().value ?? null;
    }
  }
  if (variantId == null) return null;

  return {
    workspaceKey,
    experimentId,
    variantId,
    dimensionKeys: buildDimensionKeys(m, visitorRegion),
  };
}
