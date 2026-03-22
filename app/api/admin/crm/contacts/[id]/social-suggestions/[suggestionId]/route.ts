import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { logActivity } from "@server/services/crmFoundationService";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; suggestionId: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const contactId = Number((await params).id);
    const suggestionId = Number((await params).suggestionId);
    if (!Number.isFinite(contactId) || !Number.isFinite(suggestionId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const action = body.action === "dismiss" ? "dismiss" : body.action === "apply" ? "apply" : null;
    if (!action) {
      return NextResponse.json({ error: "action must be apply or dismiss" }, { status: 400 });
    }

    const suggestion = await storage.getCrmContactSocialSuggestionById(suggestionId);
    if (!suggestion || suggestion.contactId !== contactId) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    if (action === "dismiss") {
      await storage.updateCrmContactSocialSuggestion(suggestionId, { status: "dismissed" });
      return NextResponse.json({ ok: true, status: "dismissed" });
    }

    const contact = await storage.getCrmContactById(contactId);
    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    const customFields =
      contact.customFields && typeof contact.customFields === "object" && !Array.isArray(contact.customFields) ?
        { ...(contact.customFields as Record<string, unknown>) }
      : {};
    const prevSocial =
      customFields.socialProfiles && typeof customFields.socialProfiles === "object" && !Array.isArray(customFields.socialProfiles) ?
        { ...(customFields.socialProfiles as Record<string, string>) }
      : {};

    if (suggestion.platform === "linkedin") {
      await storage.updateCrmContact(contactId, {
        linkedinUrl: suggestion.profileUrl,
        enrichmentStatus: "enriched",
        enrichedAt: new Date(),
        customFields: { ...customFields, socialProfiles: { ...prevSocial, linkedin: suggestion.profileUrl } },
      });
    } else {
      prevSocial[suggestion.platform] = suggestion.profileUrl;
      await storage.updateCrmContact(contactId, {
        customFields: { ...customFields, socialProfiles: prevSocial },
      });
    }

    await storage.updateCrmContactSocialSuggestion(suggestionId, { status: "applied" });
    const user = await getSessionUser(req);
    await logActivity(storage, {
      contactId,
      type: "research_updated",
      title: `Applied ${suggestion.platform} profile`,
      content: suggestion.profileUrl,
      metadata: { suggestionId, platform: suggestion.platform },
      createdByUserId: user?.id ?? undefined,
    });

    const updated = await storage.getCrmContactById(contactId);
    return NextResponse.json({ ok: true, status: "applied", contact: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
