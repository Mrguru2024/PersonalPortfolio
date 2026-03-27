import { NextRequest, NextResponse } from "next/server";
import { sendEmailHubNow } from "@server/services/emailHub/emailHubService";
import { mergeFieldsFromCrmContact, mergeFieldsFromEmailOnly } from "@/lib/emailMergeTags";
import { requireEmailHubSession } from "../lib/session";
import { storage } from "@server/storage";

export async function POST(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const to = Array.isArray(body.to) ? (body.to as string[]).map(String) : [];
    if (to.length === 0) return NextResponse.json({ error: "At least one recipient required" }, { status: 400 });

    let merge = null;
    const contactId = body.relatedContactId != null ? Number(body.relatedContactId) : null;
    if (contactId && to[0]) {
      const contact = await storage.getCrmContactById(contactId);
      if (contact) {
        merge = {
          ...mergeFieldsFromCrmContact(to[0], contact),
          founderName: String(body.founderName ?? user.username ?? ""),
          founderSignature: body.founderSignature != null ? String(body.founderSignature) : "",
          offerName: body.offerName != null ? String(body.offerName) : "",
          bookingLink: body.bookingLink != null ? String(body.bookingLink) : "",
        };
      }
    }
    if (!merge && to[0]) {
      merge = {
        ...mergeFieldsFromEmailOnly(to[0]),
        founderName: String(body.founderName ?? user.username ?? ""),
        founderSignature: body.founderSignature != null ? String(body.founderSignature) : "",
        offerName: body.offerName != null ? String(body.offerName) : "",
        bookingLink: body.bookingLink != null ? String(body.bookingLink) : "",
      };
    }

    const scheduledForRaw = body.scheduledFor;
    const scheduledFor =
      typeof scheduledForRaw === "string" && scheduledForRaw ? new Date(scheduledForRaw) : null;

    const result = await sendEmailHubNow({
      userId: user.id,
      isSuper: user.isSuper,
      senderId: Number(body.senderId),
      to,
      cc: Array.isArray(body.cc) ? (body.cc as string[]).map(String) : undefined,
      bcc: Array.isArray(body.bcc) ? (body.bcc as string[]).map(String) : undefined,
      subject: String(body.subject ?? ""),
      htmlBody: String(body.htmlBody ?? ""),
      textBody: body.textBody != null ? String(body.textBody) : null,
      draftId: body.draftId != null ? Number(body.draftId) : null,
      templateId: body.templateId != null ? Number(body.templateId) : null,
      relatedContactId: contactId,
      scheduledFor: scheduledFor && !Number.isNaN(scheduledFor.getTime()) ? scheduledFor : null,
      trackingOpen: body.trackingOpen !== false,
      trackingClick: body.trackingClick !== false,
      unsubFooter: body.unsubFooter === true,
      merge,
    });

    if ("ok" in result && result.ok === false) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Send failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
