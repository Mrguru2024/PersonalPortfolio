import {
  EXPERIMENT_CATALOG,
  type ExperimentDefinition,
  type ExperimentKey,
} from "@/lib/experiments/catalog";

export interface ExperimentAssignment {
  key: ExperimentKey;
  variant: string;
  source: "deterministic" | "posthog";
}

function hashToUnitInterval(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0) / 4294967295;
}

export function assignVariantDeterministically(
  definition: ExperimentDefinition,
  distinctId: string
): string {
  if (!definition.variants.length) return definition.defaultVariant;
  const index = Math.floor(
    hashToUnitInterval(`${definition.key}:${distinctId}`) * definition.variants.length
  );
  return definition.variants[index] ?? definition.defaultVariant;
}

export function assignExperiments(
  keys: ExperimentKey[],
  distinctId: string
): Record<ExperimentKey, ExperimentAssignment> {
  const assignments = {} as Record<ExperimentKey, ExperimentAssignment>;
  for (const key of keys) {
    const definition = EXPERIMENT_CATALOG[key];
    assignments[key] = {
      key,
      variant: assignVariantDeterministically(definition, distinctId),
      source: "deterministic",
    };
  }
  return assignments;
}
