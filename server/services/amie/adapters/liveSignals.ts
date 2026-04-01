import type { AmieMarketInput, AmieRawSignals } from "../types";
import { buildMockSignals } from "./mockSignals";
import { getAmieDataMode, hasBlsApiKey, hasCensusApiKey, hasGoogleApiKey } from "./env";
import { fetchGooglePlacesCompetitors } from "./googlePlacesCompetitors";

/**
 * Builds AMIE raw signals: illustrative demand/economics baseline from inputs, optionally replaced with
 * real local competitors via Google Places when GOOGLE_API_KEY is configured (Places API New + Geocoding).
 * Census/BLS hooks run only when AMIE_DATA_MODE=live and keys exist (stubs until adapters fill values).
 */
export async function fetchLiveAugmentedSignals(input: AmieMarketInput): Promise<{
  signals: AmieRawSignals;
  mode: "mock" | "live" | "mixed";
  sources: Array<{ provider: string; label: string; retrievedAt: string; note?: string }>;
}> {
  const base = buildMockSignals(input);
  const retrievedAt = new Date().toISOString();
  const sources: Array<{ provider: string; label: string; retrievedAt: string; note?: string }> = [
    {
      provider: "amie_baseline",
      label: "Demand / pricing / economics — tied to your form inputs (illustrative until Census/BLS adapters fill live fields)",
      retrievedAt,
    },
  ];

  let merged: AmieRawSignals = { ...base };
  let usedGooglePlaces = false;
  let usedConfigLive = false;

  if (hasGoogleApiKey()) {
    const key = process.env.GOOGLE_API_KEY!.trim();
    const pc = await fetchGooglePlacesCompetitors(input, key).catch((e) => {
      console.warn("[amie] fetchGooglePlacesCompetitors threw", e);
      return null;
    });

    if (pc && pc.samples.length > 0) {
      merged = {
        ...merged,
        competitorSamples: pc.samples,
        competitorCount: pc.competitorCount,
        avgCompetitorRating: pc.avgCompetitorRating,
        totalReviewCount: pc.totalReviewCount,
        competitorProvenance: "google_places",
        competitorSearchQuery: pc.searchQuery,
      };
      sources.push({
        provider: "google_places",
        label: "Google Places — Text Search",
        retrievedAt,
        note: `Real business listings, user ratings, and review counts for: “${pc.searchQuery}”. Count is results returned for this search, not a full-market census.`,
      });
      usedGooglePlaces = true;
    } else {
      sources.push({
        provider: "google_places",
        label: "Google Places — not used",
        retrievedAt,
        note: "Empty result, HTTP error, or missing Geocoding/Places permissions. Competitors below are illustrative. Enable Places API (New) + Geocoding API on the same key.",
      });
    }
  }

  if (getAmieDataMode() === "live") {
    if (hasCensusApiKey()) {
      sources.push({
        provider: "census_api",
        label: "Census API (placeholder — extend CensusAdapter)",
        retrievedAt,
        note: "Set CENSUS_API_KEY and implement fetch in liveSignals for ACS income/homeownership.",
      });
      usedConfigLive = true;
    }

    if (hasBlsApiKey()) {
      sources.push({
        provider: "bls_api",
        label: "BLS API (placeholder — extend BlsAdapter)",
        retrievedAt,
        note: "Set BLS_API_KEY for wage/employment trend augmentation.",
      });
      usedConfigLive = true;
    }

    if (!hasCensusApiKey() && !hasBlsApiKey()) {
      sources.push({
        provider: "amie_live_config",
        label: "AMIE_DATA_MODE=live without Census/BLS keys",
        retrievedAt,
        note: "Income, ownership, and CPC-style proxies still use the illustrative baseline until those adapters write real values.",
      });
    }
  }

  let mode: "mock" | "live" | "mixed" = "mock";
  if (usedGooglePlaces || (getAmieDataMode() === "live" && usedConfigLive)) {
    mode = "mixed";
  }

  return { signals: merged, mode, sources };
}
