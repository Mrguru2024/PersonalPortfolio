import type { AmieMarketInput, AmieRawSignals } from "../types";
import { buildMockSignals } from "./mockSignals";
import { getAmieDataMode, hasBlsApiKey, hasCensusApiKey } from "./env";

/**
 * Live adapter shell: attempts narrow public APIs when keys exist; always merges mock for gaps.
 * Replace stubs with real Census/BLS/Maps clients without changing metric code.
 */
export async function fetchLiveAugmentedSignals(input: AmieMarketInput): Promise<{
  signals: AmieRawSignals;
  mode: "mock" | "live" | "mixed";
  sources: Array<{ provider: string; label: string; retrievedAt: string; note?: string }>;
}> {
  const base = buildMockSignals(input);
  const sources: Array<{ provider: string; label: string; retrievedAt: string; note?: string }> = [
    {
      provider: "amie_mock",
      label: "Deterministic baseline from market inputs",
      retrievedAt: new Date().toISOString(),
    },
  ];

  if (getAmieDataMode() === "mock") {
    return { signals: base, mode: "mock", sources };
  }

  let merged = { ...base };
  let usedLive = false;

  if (hasCensusApiKey()) {
    sources.push({
      provider: "census_api",
      label: "Census API (placeholder — extend CensusAdapter)",
      retrievedAt: new Date().toISOString(),
      note: "Set CENSUS_API_KEY and implement fetch in liveSignals for ACS income/homeownership.",
    });
    usedLive = true;
  }

  if (hasBlsApiKey()) {
    sources.push({
      provider: "bls_api",
      label: "BLS API (placeholder — extend BlsAdapter)",
      retrievedAt: new Date().toISOString(),
      note: "Set BLS_API_KEY for wage/employment trend augmentation.",
    });
    usedLive = true;
  }

  if (!hasCensusApiKey() && !hasBlsApiKey()) {
    sources.push({
      provider: "amie_live_config",
      label: "Live mode without Census/BLS keys — using mock economics",
      retrievedAt: new Date().toISOString(),
    });
    return { signals: merged, mode: "mock", sources };
  }

  return {
    signals: merged,
    mode: usedLive ? "mixed" : "mock",
    sources,
  };
}
