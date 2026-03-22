import { signEmailTrackingPayload } from "@/lib/track-email";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Injects preview text (hidden preheader), tracking pixel, rewrites external links for click tracking,
 * and appends compliance footer with unsubscribe link.
 */
export function wrapEmailHtmlForSend(input: {
  html: string;
  baseUrl: string;
  previewText?: string | null;
  leadId: number;
  /** Must match /^commSend-\d+$/ — used with existing /api/track/email/* routes */
  trackingEmailId: string;
  unsubscribeUrl?: string | null;
  /** Nth external https link → block id appended as `&block=` on the tracking URL */
  resolveBlockIdForLinkIndex?: (linkIndex: number) => string | undefined;
}): string {
  const token = signEmailTrackingPayload(input.leadId, input.trackingEmailId);
  const pixel = `${input.baseUrl.replace(/\/$/, "")}/api/track/email/open?token=${encodeURIComponent(token)}`;

  let html = input.html;
  const preheader =
    input.previewText?.trim() ?
      `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:transparent;width:0;height:0;">
  ${escapeHtml(input.previewText.trim())}
</div>`
    : "";

  // Rewrite http(s) links (skip mailto, tel, #, and already-tracked)
  const clickBase = `${input.baseUrl.replace(/\/$/, "")}/api/track/email/click?token=${encodeURIComponent(token)}&url=`;
  let linkIndex = 0;
  html = html.replace(
    /\shref=["'](https?:\/\/[^"']+)["']/gi,
    (_m, url: string) => {
      if (/mailto:|tel:/i.test(url)) return ` href="${url}"`;
      const enc = encodeURIComponent(url);
      const blockId = input.resolveBlockIdForLinkIndex?.(linkIndex);
      linkIndex += 1;
      const blockQ = blockId ? `&block=${encodeURIComponent(blockId)}` : "";
      return ` href="${clickBase}${enc}${blockQ}"`;
    }
  );

  const footerParts: string[] = [];
  if (input.unsubscribeUrl) {
    footerParts.push(
      `<p style="font-size:12px;color:#666;margin-top:24px;">Prefer fewer emails? <a href="${escapeHtml(input.unsubscribeUrl)}">Unsubscribe</a>.</p>`
    );
  }
  footerParts.push(
    `<p style="font-size:11px;color:#999;margin-top:8px;">Ascendra Technologies</p>`
  );

  const pixelTag = `<img src="${escapeHtml(pixel)}" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px;" />`;

  if (/<\/body>/i.test(html)) {
    return html.replace(
      /<\/body>/i,
      `${preheader}${pixelTag}${footerParts.join("")}</body>`
    );
  }
  return `${preheader}<div>${html}</div>${pixelTag}${footerParts.join("")}`;
}
