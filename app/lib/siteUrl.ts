/**
 * Canonical base URL for the site. Used for Open Graph, Twitter cards, canonical links, and emails.
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://yoursite.com) so social shares show the correct URL and image.
 * After changing, use Facebook Sharing Debugger / Twitter Card Validator / LinkedIn Post Inspector to refresh cached metadata.
 */
export function getSiteBaseUrl(): string {
  return (
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_URL) ||
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BASE_URL) ||
    "https://mrguru.dev"
  );
}

/** Ensures URL has a scheme (https:// or http://). Required for OAuth redirect_uri. */
export function ensureAbsoluteUrl(url: string): string {
  const trimmed = url.replace(/\/$/, "").trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed === "localhost" || /^localhost:\d+$/.test(trimmed)) return `http://${trimmed}`;
  return `https://${trimmed}`;
}
