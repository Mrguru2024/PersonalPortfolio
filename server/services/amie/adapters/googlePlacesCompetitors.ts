/**
 * Google Places API (New) — Text Search for real local competitors matching AMIE market inputs.
 * Requires GOOGLE_API_KEY with Places API (New) + Geocoding API enabled.
 * https://developers.google.com/maps/documentation/places/web-service/text-search
 */
import type { AmieMarketInput, AmieRawSignals } from "../types";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function geocodeLocation(address: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;
  const u = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  u.searchParams.set("address", trimmed);
  u.searchParams.set("key", apiKey);
  try {
    const res = await fetch(u.toString());
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: string;
      results?: Array<{ geometry: { location: { lat: number; lng: number } } }>;
    };
    if (data.status !== "OK" || !data.results?.[0]?.geometry?.location) return null;
    const loc = data.results[0].geometry.location;
    return { lat: loc.lat, lng: loc.lng };
  } catch {
    return null;
  }
}

type PlaceRow = {
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude?: number; longitude?: number };
};

function buildTextQuery(input: AmieMarketInput): string {
  const parts = [
    input.serviceType?.trim(),
    input.industry?.trim(),
    input.location?.trim(),
  ].filter(Boolean);
  const q = parts.join(" ").replace(/\s+/g, " ").trim();
  return q.slice(0, 200);
}

export type GooglePlacesCompetitorResult = {
  samples: AmieRawSignals["competitorSamples"];
  competitorCount: number;
  avgCompetitorRating: number;
  totalReviewCount: number;
  searchQuery: string;
};

export async function fetchGooglePlacesCompetitors(
  input: AmieMarketInput,
  apiKey: string,
): Promise<GooglePlacesCompetitorResult | null> {
  const textQuery = buildTextQuery(input);
  if (textQuery.length < 3) return null;

  const geoAddress = input.location?.trim() || textQuery;
  const center = await geocodeLocation(geoAddress, apiKey);

  const body: Record<string, unknown> = {
    textQuery,
    maxResultCount: 20,
    languageCode: "en",
  };

  if (center) {
    body.locationBias = {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: 40_000,
      },
    };
  }

  let res: Response;
  try {
    res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.location",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.warn("[amie] Google Places network error", e);
    return null;
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.warn("[amie] Google Places HTTP", res.status, errText.slice(0, 300));
    return null;
  }

  const json = (await res.json()) as { places?: PlaceRow[] };
  const places = json.places ?? [];
  if (!places.length) return null;

  type Row = {
    name: string;
    rating: number;
    reviewCount: number;
    distanceKm: number;
    formattedAddress?: string;
  };

  const rows: Row[] = [];

  for (const p of places) {
    const name = p.displayName?.text?.trim();
    if (!name) continue;
    const lat = p.location?.latitude;
    const lng = p.location?.longitude;
    let distanceKm = 0;
    if (center != null && typeof lat === "number" && typeof lng === "number") {
      distanceKm = Math.round(haversineKm(center.lat, center.lng, lat, lng) * 10) / 10;
    }
    const rating = typeof p.rating === "number" && p.rating > 0 ? p.rating : 0;
    const reviewCount = typeof p.userRatingCount === "number" && p.userRatingCount >= 0 ? p.userRatingCount : 0;
    rows.push({
      name,
      rating,
      reviewCount,
      distanceKm,
      formattedAddress: p.formattedAddress?.trim(),
    });
  }

  if (!rows.length) return null;

  if (center) {
    rows.sort((a, b) => a.distanceKm - b.distanceKm);
  } else {
    rows.sort((a, b) => b.reviewCount - a.reviewCount);
  }

  const capped = rows.slice(0, 15);

  const rated = capped.filter((r) => r.rating > 0);
  const avgCompetitorRating =
    rated.length > 0 ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 3.25;

  const totalReviewCount = capped.reduce((s, r) => s + r.reviewCount, 0);

  const samples: AmieRawSignals["competitorSamples"] = capped.map((r) => ({
    name: r.name,
    rating: r.rating > 0 ? Math.min(5, r.rating) : 0,
    reviewCount: r.reviewCount,
    distanceKm: r.distanceKm,
    ...(r.formattedAddress ? { formattedAddress: r.formattedAddress } : {}),
  }));

  return {
    samples,
    /** Count of listings returned for this search (not total market TAM). */
    competitorCount: capped.length,
    avgCompetitorRating: Math.round(avgCompetitorRating * 100) / 100,
    totalReviewCount,
    searchQuery: textQuery,
  };
}
