import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { resolveCommCampaignRecipients } from "@server/services/communications/resolveAudience";
import type { CommSegmentFilters } from "@shared/communicationsSchema";

export const dynamic = "force-dynamic";

/** POST — count / sample contacts matching segment filters (no send). */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    let filters = (body.segmentFilters ?? {}) as CommSegmentFilters;
    const savedListId = body.savedListId != null ? Number(body.savedListId) : null;
    if (savedListId && Number.isFinite(savedListId)) {
      const list = await storage.getCrmSavedListById(savedListId);
      if (list?.filters) {
        filters = { ...list.filters, ...filters };
      }
    }
    const recipients = await resolveCommCampaignRecipients(storage, filters);
    const sample = recipients.slice(0, 25).map((r) =>
      r.source === "crm" ?
        {
          id: r.contact.id,
          email: r.contact.email,
          name: r.contact.name,
          status: r.contact.status,
          source: r.contact.source,
          inCrm: true as const,
        }
      : {
          id: null,
          email: r.email,
          name: "(not in CRM)",
          status: null,
          source: null,
          inCrm: false as const,
        },
    );
    return NextResponse.json({ count: recipients.length, sample });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Preview failed" }, { status: 500 });
  }
}
