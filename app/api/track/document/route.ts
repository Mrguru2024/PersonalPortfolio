import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { computeIntentScore } from "@/lib/crm-intent";

export const dynamic = "force-dynamic";

/** POST /api/track/document — record proposal/document view. Public (called from proposal view page with viewToken). */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const viewToken = typeof body.viewToken === "string" ? body.viewToken.trim() : null;
    const eventDetail = typeof body.eventDetail === "string" ? body.eventDetail : "viewed";
    const viewTimeSeconds = typeof body.viewTimeSeconds === "number" ? body.viewTimeSeconds : undefined;
    const ua = req.headers.get("user-agent") || undefined;
    const deviceType = ua && /Mobile|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";

    if (!viewToken) {
      return NextResponse.json({ error: "viewToken required" }, { status: 400 });
    }

    const quote = await storage.getClientQuoteByViewToken(viewToken);
    if (!quote) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    const documentId = String(quote.id);
    const quoteId = quote.id;
    const leadId = await storage.getCrmContactIdByQuoteId(quote.id);

    const docEvent = await storage.upsertDocumentEvent({
      documentId,
      documentType: "proposal",
      leadId,
      quoteId,
      viewTimeSeconds,
      eventDetail: eventDetail === "heartbeat" ? "heartbeat" : eventDetail === "downloaded" ? "downloaded" : "viewed",
      deviceType,
    });

    if (leadId && docEvent.viewCount >= 2) {
      await storage.createCrmAlert({
        leadId,
        alertType: "proposal_multiple_views",
        title: "Proposal opened multiple times",
        message: `Lead has viewed the proposal ${docEvent.viewCount} times.`,
        metadata: { quoteId, viewCount: docEvent.viewCount },
      });
    } else if (leadId && docEvent.viewCount === 1) {
      await storage.createCrmAlert({
        leadId,
        alertType: "proposal_opened",
        title: "Proposal opened",
        message: "Lead viewed the proposal.",
        metadata: { quoteId },
      });
    }

    if (leadId) {
      const events = await storage.getCommunicationEventsByLeadId(leadId);
      const docEvents = await storage.getDocumentEventsByLeadId(leadId);
      const emailOpens = events.filter((e) => e.eventType === "open").length;
      const emailClicks = events.filter((e) => e.eventType === "click").length;
      const emailReplies = events.filter((e) => e.eventType === "reply").length;
      const proposalViews = docEvents.reduce((s, e) => s + e.viewCount, 0);
      const proposalViewTimeSeconds = docEvents.reduce((s, e) => s + (e.totalViewTimeSeconds ?? 0), 0);
      const visitorRows = await storage.getVisitorActivityByLeadId(leadId);
      const pricingPageVisits = visitorRows.filter((r) => r.pageVisited?.includes("pricing") || r.pageVisited?.includes("audit")).length;
      const returnVisits24h = 0;
      const toolInteractions = visitorRows.filter((r) => r.eventType === "tool_used").length;
      const formCompletions = visitorRows.filter((r) => r.eventType === "form_completed").length;
      const { score, level } = computeIntentScore({
        emailOpens,
        emailClicks,
        emailReplies,
        proposalViews,
        proposalViewTimeSeconds,
        pricingPageVisits,
        returnVisits24h,
        toolInteractions,
        formCompletions,
      });
      await storage.updateCrmContact(leadId, { leadScore: score, intentLevel: level });
    }

    return NextResponse.json({ ok: true, viewCount: docEvent.viewCount });
  } catch (e) {
    console.error("Document track error:", e);
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }
}
