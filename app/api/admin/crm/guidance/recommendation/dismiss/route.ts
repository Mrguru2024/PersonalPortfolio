import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { logActivity } from "@server/services/crmFoundationService";

export const dynamic = "force-dynamic";

/** POST /api/admin/crm/guidance/recommendation/dismiss — log dismissal of AI recommendation. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const contactId = body.contactId != null ? Number(body.contactId) : undefined;
    const label = typeof body.label === "string" ? body.label.trim() : "";

    if (contactId != null && !Number.isFinite(contactId)) {
      return NextResponse.json({ error: "Invalid contactId" }, { status: 400 });
    }
    if (contactId != null) {
      const contact = await storage.getCrmContactById(contactId);
      if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    await logActivity(storage, {
      contactId,
      type: "ai_recommendation_dismissed",
      title: "AI recommendation dismissed",
      content: label || "Recommendation dismissed",
      metadata: { recommendationLabel: label },
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Recommendation dismiss error:", error);
    return NextResponse.json({ error: "Failed to log dismissal" }, { status: 500 });
  }
}
