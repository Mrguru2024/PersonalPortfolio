/**
 * Lead demographics from external providers: Google Analytics 4, Facebook/Meta Insights.
 * Vercel Analytics has no public REST API — use internal visitor_activity + UTM for attribution.
 *
 * Configure:
 * - GA4: GA4_PROPERTY_ID (e.g. 123456789), GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY (PEM string or base64)
 * - Facebook: FACEBOOK_ACCESS_TOKEN (or META_ACCESS_TOKEN), FACEBOOK_PAGE_ID (or META_PAGE_ID)
 */

export type ExternalDemographics = {
  byAgeRange: { value: string; count: number }[];
  byGender: { value: string; count: number }[];
  byCountry?: { value: string; count: number }[];
  source: "google_analytics" | "facebook_insights" | "vercel";
  fetchedAt: string;
};

/** Normalize and merge multiple external demographics into one view (by source). */
export type MergedExternalDemographics = {
  google_analytics: ExternalDemographics | null;
  facebook_insights: ExternalDemographics | null;
  /** Vercel: no API; data stays in Vercel dashboard only. */
  vercel: null;
};

/**
 * Fetch demographics from Google Analytics 4 when GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY are set.
 * Uses GA4 Data API (runReport) with dimensions: country, userAgeBracket, userGender (when Google Signals enabled).
 */
async function fetchGa4Demographics(since?: Date): Promise<ExternalDemographics | null> {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const clientEmail = process.env.GA4_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GA4_PRIVATE_KEY?.trim();
  if (!propertyId || !clientEmail || !privateKey) return null;

  try {
    const jwt = await createGa4Jwt(clientEmail, privateKey);
    const accessToken = await exchangeJwtForToken(jwt);
    const endDate = new Date();
    const startDate = since ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const format = (d: Date) => d.toISOString().slice(0, 10);

    const byCountry: { value: string; count: number }[] = [];
    const byAgeRange: { value: string; count: number }[] = [];
    const byGender: { value: string; count: number }[] = [];

    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: format(startDate), endDate: format(endDate) }],
          dimensions: [{ name: "country" }],
          metrics: [{ name: "activeUsers" }],
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.warn("GA4 runReport (country) failed:", res.status, err);
      return null;
    }
    const data = (await res.json()) as { rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[] };
    for (const row of data.rows ?? []) {
      const country = row.dimensionValues?.[0]?.value ?? "(not set)";
      const count = Number(row.metricValues?.[0]?.value ?? 0);
      if (country && count > 0) byCountry.push({ value: country, count });
    }

    const res2 = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: format(startDate), endDate: format(endDate) }],
          dimensions: [{ name: "userAgeBracket" }],
          metrics: [{ name: "activeUsers" }],
        }),
      }
    );
    if (res2.ok) {
      const data2 = (await res2.json()) as { rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[] };
      for (const row of data2.rows ?? []) {
        const value = row.dimensionValues?.[0]?.value ?? "(not set)";
        const count = Number(row.metricValues?.[0]?.value ?? 0);
        if (value && count > 0) byAgeRange.push({ value, count });
      }
    }

    const res3 = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: format(startDate), endDate: format(endDate) }],
          dimensions: [{ name: "userGender" }],
          metrics: [{ name: "activeUsers" }],
        }),
      }
    );
    if (res3.ok) {
      const data3 = (await res3.json()) as { rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[] };
      for (const row of data3.rows ?? []) {
        const value = row.dimensionValues?.[0]?.value ?? "(not set)";
        const count = Number(row.metricValues?.[0]?.value ?? 0);
        if (value && count > 0) byGender.push({ value, count });
      }
    }

    return {
      byAgeRange: byAgeRange.sort((a, b) => b.count - a.count),
      byGender: byGender.sort((a, b) => b.count - a.count),
      byCountry: byCountry.sort((a, b) => b.count - a.count),
      source: "google_analytics",
      fetchedAt: new Date().toISOString(),
    };
  } catch (e) {
    console.warn("GA4 demographics error:", e);
    return null;
  }
}

async function createGa4Jwt(clientEmail: string, privateKeyPem: string): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
  };
  const base64url = (buf: Buffer) => buf.toString("base64url");
  const signInput = `${base64url(Buffer.from(JSON.stringify(header)))}.${base64url(Buffer.from(JSON.stringify(payload)))}`;
  const key = privateKeyPem.replace(/\\n/g, "\n");
  const crypto = await import("crypto");
  const sig = crypto.createSign("RSA-SHA256").update(signInput).sign(key, "base64url");
  return `${signInput}.${sig}`;
}

async function exchangeJwtForToken(jwt: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`GA4 token exchange failed: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Fetch audience demographics from Facebook Page Insights when FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID are set.
 * Requires page with sufficient audience; metrics may require 100+ fans.
 */
async function fetchFacebookDemographics(since?: Date): Promise<ExternalDemographics | null> {
  const token = (process.env.FACEBOOK_ACCESS_TOKEN ?? process.env.META_ACCESS_TOKEN)?.trim();
  const pageId = (process.env.FACEBOOK_PAGE_ID ?? process.env.META_PAGE_ID)?.trim();
  if (!token || !pageId) return null;

  try {
    const byAgeRange: { value: string; count: number }[] = [];
    const byGender: { value: string; count: number }[] = [];
    const byCountry: { value: string; count: number }[] = [];
    const until = new Date();
    const sinceDate = since ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const period = "day";

    const metrics = ["page_fans_gender_age", "page_fans_country"];
    for (const metric of metrics) {
      const url = new URL(`https://graph.facebook.com/v21.0/${pageId}/insights`);
      url.searchParams.set("access_token", token);
      url.searchParams.set("metric", metric);
      url.searchParams.set("period", period);
      url.searchParams.set("since", String(Math.floor(sinceDate.getTime() / 1000)));
      url.searchParams.set("until", String(Math.floor(until.getTime() / 1000)));
      const res = await fetch(url.toString());
      if (!res.ok) continue;
      const data = (await res.json()) as { data?: { values?: { value?: Record<string, string> }[] }[] };
      for (const entry of data.data ?? []) {
        const values = entry.values ?? [];
        const last = values[values.length - 1]?.value;
        if (!last) continue;
        for (const [key, value] of Object.entries(last)) {
          const count = parseInt(value, 10) || 0;
          if (count <= 0) continue;
          if (metric === "page_fans_gender_age") {
            const ageMatch = key.match(/^([fm]|u)\.(\d+)-(\d+)$/i) || key.match(/^([fm]|u)\.(\d+)\+$/i);
            if (ageMatch) {
              const gender = ageMatch[1].toLowerCase() === "f" ? "female" : ageMatch[1].toLowerCase() === "m" ? "male" : "unknown";
              const age = ageMatch[2] ? `${ageMatch[2]}-${ageMatch[3] ?? "65+"}` : "unknown";
              byGender.push({ value: gender, count });
              byAgeRange.push({ value: age, count });
            }
          } else if (metric === "page_fans_country") {
            byCountry.push({ value: key, count });
          }
        }
      }
    }

    const aggAge = new Map<string, number>();
    for (const a of byAgeRange) {
      aggAge.set(a.value, (aggAge.get(a.value) ?? 0) + a.count);
    }
    const aggGender = new Map<string, number>();
    for (const g of byGender) {
      aggGender.set(g.value, (aggGender.get(g.value) ?? 0) + g.count);
    }

    return {
      byAgeRange: [...aggAge.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count),
      byGender: [...aggGender.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count),
      byCountry: byCountry.sort((a, b) => b.count - a.count),
      source: "facebook_insights",
      fetchedAt: new Date().toISOString(),
    };
  } catch (e) {
    console.warn("Facebook demographics error:", e);
    return null;
  }
}

/**
 * Returns merged external demographics from GA4 and Facebook when credentials are set.
 * Vercel Analytics has no pull API — use internal visitor_activity + UTM for traffic and attribution.
 */
export async function getExternalDemographics(since?: Date): Promise<MergedExternalDemographics> {
  const [google_analytics, facebook_insights] = await Promise.all([
    fetchGa4Demographics(since),
    fetchFacebookDemographics(since),
  ]);
  return {
    google_analytics,
    facebook_insights,
    vercel: null,
  };
}
