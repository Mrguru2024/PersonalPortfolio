import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { resolveCommAudience } from "@server/services/communications/resolveAudience";
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
    const contacts = await resolveCommAudience(storage, filters);
    const sample = contacts.slice(0, 25).map((c) => ({
      id: c.id,
      email: c.email,
      name: c.name,
      status: c.status,
      source: c.source,
    }));
    return NextResponse.json({ count: contacts.length, sample });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Preview failed" }, { status: 500 });
  }
}
