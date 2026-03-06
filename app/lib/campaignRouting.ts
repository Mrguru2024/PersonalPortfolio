type SearchParamsRecord = Record<string, string | string[] | undefined>;

type PersonaKey = "contractor" | "local" | "startup";

const PERSONA_ROUTE_MAP: Record<PersonaKey, string> = {
  contractor: "/contractor-systems",
  local: "/local-business-growth",
  startup: "/startup-mvp-development",
};

const PERSONA_KEYWORDS: Record<PersonaKey, string[]> = {
  contractor: [
    "contractor",
    "trade",
    "trades",
    "hvac",
    "plumbing",
    "roofing",
    "electrician",
    "home service",
  ],
  local: [
    "local business",
    "local",
    "small business",
    "appointment funnel",
    "service business",
  ],
  startup: ["startup", "founder", "mvp", "saas", "product build"],
};

function toSingle(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function normalize(value: string | undefined): string {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function inferPersonaFromText(text: string): PersonaKey | null {
  const normalized = normalize(text);
  if (!normalized) return null;

  for (const [persona, keywords] of Object.entries(PERSONA_KEYWORDS) as [
    PersonaKey,
    string[],
  ][]) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return persona;
    }
  }
  return null;
}

function resolvePersonaValue(value: string | undefined): PersonaKey | null {
  const normalized = normalize(value);
  if (!normalized) return null;

  if (normalized.includes("contractor") || normalized.includes("trade")) {
    return "contractor";
  }
  if (normalized.includes("local")) {
    return "local";
  }
  if (
    normalized.includes("startup") ||
    normalized.includes("founder") ||
    normalized.includes("mvp") ||
    normalized.includes("saas")
  ) {
    return "startup";
  }

  return inferPersonaFromText(normalized);
}

function shouldSkipAutoRouting(searchParams: SearchParamsRecord): boolean {
  const flag =
    toSingle(searchParams.no_auto_route) ||
    toSingle(searchParams.no_persona_redirect);
  return flag === "1" || normalize(flag) === "true";
}

export function resolveCampaignLandingPath(
  searchParams: SearchParamsRecord
): string | null {
  if (shouldSkipAutoRouting(searchParams)) return null;

  const explicitPersona = resolvePersonaValue(toSingle(searchParams.persona));
  if (explicitPersona) {
    return PERSONA_ROUTE_MAP[explicitPersona];
  }

  const campaignFields = [
    toSingle(searchParams.utm_campaign),
    toSingle(searchParams.campaign),
    toSingle(searchParams.utm_source),
    toSingle(searchParams.source),
    toSingle(searchParams.utm_content),
  ];

  for (const field of campaignFields) {
    const inferred = inferPersonaFromText(field || "");
    if (inferred) {
      return PERSONA_ROUTE_MAP[inferred];
    }
  }

  return null;
}

export function toQueryString(searchParams: SearchParamsRecord): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item != null) params.append(key, item);
      }
    } else {
      params.set(key, value);
    }
  }
  return params.toString();
}

function buildCampaignUrl(input: {
  persona: PersonaKey;
  source: string;
  medium: string;
  campaign: string;
  content?: string;
}): string {
  const params = new URLSearchParams({
    persona: input.persona,
    utm_source: input.source,
    utm_medium: input.medium,
    utm_campaign: input.campaign,
  });
  if (input.content) params.set("utm_content", input.content);
  return `/?${params.toString()}`;
}

// Ready-to-use paid acquisition URLs.
export const PAID_CAMPAIGN_URLS = {
  contractorGoogleAds: buildCampaignUrl({
    persona: "contractor",
    source: "google",
    medium: "cpc",
    campaign: "contractor-systems",
    content: "search-lead-gen",
  }),
  localBusinessMetaAds: buildCampaignUrl({
    persona: "local",
    source: "meta",
    medium: "paid-social",
    campaign: "local-business-growth",
    content: "lead-form-traffic",
  }),
  startupLinkedInAds: buildCampaignUrl({
    persona: "startup",
    source: "linkedin",
    medium: "paid-social",
    campaign: "startup-mvp-development",
    content: "founder-offer",
  }),
} as const;

