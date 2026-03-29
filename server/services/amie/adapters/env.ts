/** AMIE external data — all optional; mock fills gaps. */
export function getAmieDataMode(): "mock" | "live" {
  const v = process.env.AMIE_DATA_MODE?.trim().toLowerCase();
  if (v === "live") return "live";
  return "mock";
}

export function hasCensusApiKey(): boolean {
  return Boolean(process.env.CENSUS_API_KEY?.trim());
}

export function hasBlsApiKey(): boolean {
  return Boolean(process.env.BLS_API_KEY?.trim());
}

export function hasGoogleApiKey(): boolean {
  return Boolean(process.env.GOOGLE_API_KEY?.trim());
}
