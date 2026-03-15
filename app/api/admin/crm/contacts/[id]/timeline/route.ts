import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

type TimelineItem = {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

/** GET /api/admin/crm/contacts/[id]/timeline — unified activity timeline for a lead. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const contact = await storage.getCrmContactById(id);
    if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [activities, commEvents, docEvents, docLog, visitorRows] = await Promise.all([
      storage.getCrmActivities(id),
      storage.getCommunicationEventsByLeadId(id),
      storage.getDocumentEventsByLeadId(id),
      storage.getDocumentEventLogByLeadId(id),
      storage.getVisitorActivityByLeadId(id),
    ]);

    const items: TimelineItem[] = [];

    for (const a of activities) {
      items.push({
        id: `activity-${a.id}`,
        type: "activity",
        title: a.type.charAt(0).toUpperCase() + a.type.slice(1),
        description: a.subject || a.body?.slice(0, 200),
        createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
        metadata: { dealId: a.dealId },
      });
    }
    for (const e of commEvents) {
      items.push({
        id: `comm-${e.id}`,
        type: `email_${e.eventType}`,
        title: `Email ${e.eventType}`,
        description: e.emailId ? `Campaign: ${e.emailId}` : undefined,
        createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
        metadata: e.metadata ? (e.metadata as Record<string, unknown>) : undefined,
      });
    }
    for (const e of docLog) {
      items.push({
        id: `doclog-${e.id}`,
        type: "document_view",
        title: `${e.documentType} ${e.eventDetail}`,
        description: e.viewTimeSeconds != null ? `Viewed ${e.viewTimeSeconds}s` : undefined,
        createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
        metadata: { documentId: e.documentId },
      });
    }
    for (const v of visitorRows) {
      items.push({
        id: `visitor-${v.id}`,
        type: "visitor",
        title: v.eventType.replace(/_/g, " "),
        description: v.pageVisited || undefined,
        createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : String(v.createdAt),
        metadata: v.pageVisited ? { page: v.pageVisited } : undefined,
      });
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ timeline: items });
  } catch (error: any) {
    console.error("CRM timeline error:", error);
    return NextResponse.json({ error: "Failed to load timeline" }, { status: 500 });
  }
}
