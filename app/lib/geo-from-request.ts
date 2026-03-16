import { NextRequest } from "next/server";

/** Geo/demographics derived from request headers (Vercel, Cloudflare, or similar). No external API calls. */
export interface RequestGeo {
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
}

/**
 * Extract location from request headers. Supports:
 * - Vercel: x-vercel-ip-country, x-vercel-ip-country-region, x-vercel-ip-city
 * - Cloudflare: cf-ipcountry (country code)
 * - Standard: x-geo-country, x-geo-region, x-geo-city, x-geo-timezone
 */
export function getGeoFromRequest(req: NextRequest): RequestGeo {
  const headers = req.headers;
  const get = (name: string): string | null => {
    const v = headers.get(name);
    return v && v.trim() !== "" ? v.trim() : null;
  };

  const country =
    get("x-vercel-ip-country") ??
    get("cf-ipcountry") ??
    get("x-geo-country") ??
    null;
  const region =
    get("x-vercel-ip-country-region") ??
    get("x-geo-region") ??
    null;
  const city =
    get("x-vercel-ip-city") ??
    get("x-geo-city") ??
    null;
  const timezone =
    get("x-vercel-ip-timezone") ??
    get("x-geo-timezone") ??
    null;

  return { country, region, city, timezone };
}
