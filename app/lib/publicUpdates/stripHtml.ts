/** Minimal HTML strip for RSS/description snippets (not a full sanitizer). */
export function stripHtmlToText(html: string, maxLen?: number): string {
  const plain = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (maxLen != null && plain.length > maxLen) {
    return `${plain.slice(0, maxLen - 1).trim()}…`;
  }
  return plain;
}
