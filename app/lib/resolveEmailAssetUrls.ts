/** Turn root-relative /uploads/... (and similar) into absolute URLs for email clients. */
export function resolveRelativeUrlsForEmail(html: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");
  if (!base) return html;
  return html.replace(/\b(src|href)=(["'])(\/[^"']+)\2/gi, (_m, attr: string, q: string, path: string) => {
    if (!path.startsWith("/")) return `${attr}=${q}${path}${q}`;
    if (/^https?:\/\//i.test(path)) return `${attr}=${q}${path}${q}`;
    return `${attr}=${q}${base}${path}${q}`;
  });
}
