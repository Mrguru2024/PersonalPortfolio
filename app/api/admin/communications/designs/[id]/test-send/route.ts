import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  applyEmailMergeTags,
  mergeFieldsFromCrmContact,
  mergeFieldsFromEmailOnly,
} from "@/lib/emailMergeTags";
import { resolveRelativeUrlsForEmail } from "@/lib/resolveEmailAssetUrls";
import { storage } from "@server/storage";
import { sendBrevoTransactional } from "@server/services/communications/brevoTransactional";

export const dynamic = "force-dynamic";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function testSendBaseUrl(req: NextRequest): string {
  const origin = req.headers.get("origin")?.replace(/\/$/, "");
  if (origin && /^https?:\/\//i.test(origin)) return origin;
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

/** POST — send design to a test inbox (no tracking pixel; production sends use campaigns). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const design = await storage.getCommEmailDesignById(id);
    if (!design) return NextResponse.json({ error: "Design not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const to = typeof body.to === "string" ? body.to.trim() : "";
    if (!to) return NextResponse.json({ error: "to (email) is required" }, { status: 400 });

    const contactId = body.contactId != null ? Number(body.contactId) : null;
    const contact =
      contactId && Number.isFinite(contactId) ? await storage.getCrmContactById(contactId) : undefined;
    const fields =
      contact?.email ?
        mergeFieldsFromCrmContact(contact.email, {
          firstName: contact.firstName,
          name: contact.name,
          company: contact.company,
        })
      : mergeFieldsFromEmailOnly(to);

    const base = testSendBaseUrl(req);
    const subjectMerged = applyEmailMergeTags(design.subject, fields, { htmlEscape: false });
    const htmlMerged = applyEmailMergeTags(design.htmlContent, fields, { htmlEscape: true });
    const html = resolveRelativeUrlsForEmail(htmlMerged, base);
    const plainMerged = design.plainText
      ? applyEmailMergeTags(design.plainText, fields, { htmlEscape: false })
      : undefined;

    const previewMerged = design.previewText?.trim()
      ? applyEmailMergeTags(design.previewText.trim(), fields, { htmlEscape: false })
      : "";
    const preheader = previewMerged
      ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:transparent;width:0;height:0;">${escapeHtml(previewMerged)}</div>`
      : "";

    const result = await sendBrevoTransactional({
      to,
      subject: `[TEST] ${subjectMerged}`,
      htmlContent: `${preheader}${html}`,
      textContent: plainMerged,
      senderName: design.senderName,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Test send failed" }, { status: 500 });
  }
}
