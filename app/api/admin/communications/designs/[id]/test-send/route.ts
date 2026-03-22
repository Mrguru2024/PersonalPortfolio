import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
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

    let html = design.htmlContent;
    const contactId = body.contactId != null ? Number(body.contactId) : null;
    if (contactId && Number.isFinite(contactId)) {
      const contact = await storage.getCrmContactById(contactId);
      if (contact) {
        const first = (contact.firstName || contact.name || "").split(/\s+/)[0] || "there";
        html = html
          .replace(/\{\{\s*firstName\s*\}\}/gi, first)
          .replace(/\{\{\s*company\s*\}\}/gi, contact.company || "your team");
      }
    }

    const preheader = design.previewText?.trim()
      ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:transparent;width:0;height:0;">${escapeHtml(design.previewText.trim())}</div>`
      : "";

    const result = await sendBrevoTransactional({
      to,
      subject: `[TEST] ${design.subject}`,
      htmlContent: `${preheader}${html}`,
      textContent: design.plainText ?? undefined,
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
