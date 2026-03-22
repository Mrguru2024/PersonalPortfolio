export type SocialPlatform = "linkedin" | "x" | "facebook" | "instagram" | "github" | "other";

const PLATFORM_PATTERNS: { platform: SocialPlatform; hosts: RegExp; pathTest?: RegExp }[] = [
  { platform: "linkedin", hosts: /^(www\.)?linkedin\.com$/i, pathTest: /^\/(in|company|school)\//i },
  { platform: "x", hosts: /^(www\.)?(x\.com|twitter\.com)$/i },
  { platform: "facebook", hosts: /^(www\.)?facebook\.com$/i },
  { platform: "instagram", hosts: /^(www\.)?instagram\.com$/i },
  { platform: "github", hosts: /^(www\.)?github\.com$/i, pathTest: /^\/[^/]+/ },
];

export function detectSocialPlatformFromUrl(rawUrl: string): SocialPlatform | null {
  try {
    const u = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    const host = u.hostname.toLowerCase();
    for (const { platform, hosts, pathTest } of PLATFORM_PATTERNS) {
      if (!hosts.test(host)) continue;
      if (pathTest && !pathTest.test(u.pathname)) continue;
      return platform;
    }
    return null;
  } catch {
    return null;
  }
}

export function normalizeSocialProfileUrl(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    u.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "fbclid", "gclid"].forEach((k) => u.searchParams.delete(k));
    u.protocol = "https:";
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function buildManualSocialSearchLinks(input: {
  name: string;
  company?: string | null;
  jobTitle?: string | null;
}): { label: string; url: string }[] {
  const q = [input.name.trim(), input.company?.trim(), input.jobTitle?.trim()].filter(Boolean).join(" ");
  const enc = encodeURIComponent(q);
  return [
    { label: "Web (DuckDuckGo)", url: `https://duckduckgo.com/?q=${enc}+linkedin` },
    { label: "Web (Google)", url: `https://www.google.com/search?q=${enc}+site%3Alinkedin.com%2Fin` },
    { label: "X / Twitter", url: `https://duckduckgo.com/?q=${enc}+site%3Ax.com` },
  ];
}
