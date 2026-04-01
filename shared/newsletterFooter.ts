/** Homepage URL with UTM for newsletter traffic (analytics-safe for email clients). */
export function newsletterSiteHomeUrl(siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}/?utm_source=newsletter&utm_medium=email&utm_campaign=newsletter_site_link`;
}

/** Appends a site-home link to newsletter HTML for recipients. Safe for HTML email bodies. */
export function appendNewsletterSiteVisitFooter(
  html: string,
  siteUrl: string,
  linkLabel = "Visit our website"
): string {
  const home = newsletterSiteHomeUrl(siteUrl);
  const safeLabel = linkLabel
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const block = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;border-top:1px solid #e5e7eb;"><tr><td align="center" style="padding:20px 14px;font-family:system-ui,sans-serif;font-size:14px;color:#4b5563;"><p style="margin:0 0 6px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;">Quick link</p><p style="margin:0 0 12px 0;font-size:15px;line-height:1.4;color:#111827;font-weight:600;">Jump to our site anytime</p><a href="${home}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#ffffff !important;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">${safeLabel}</a><p style="margin:12px 0 0 0;font-size:12px;color:#6b7280;line-height:1.4;">Prefer typing it in? Open: ${home.replace(/&/g, "&amp;")}</p></td></tr></table>`;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${block}</body>`);
  return `${html}${block}`;
}

export function appendNewsletterSiteVisitFooterPlain(text: string, siteUrl: string): string {
  const home = newsletterSiteHomeUrl(siteUrl);
  const t = text.trim();
  if (!t) return `Quick link — visit our site: ${home}`;
  return `${t}\n\n---\nQuick link — visit our site: ${home}`;
}
