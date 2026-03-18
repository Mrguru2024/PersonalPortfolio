import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/challenge/leads — list challenge registrations (admin). */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const list = await storage.listChallengeRegistrations();
    const withContact = await Promise.all(
      list.map(async (reg) => {
        const contact = reg.contactId ? await storage.getCrmContactById(reg.contactId) : null;
        const custom = contact?.customFields as Record<string, unknown> | null | undefined;
        return {
          id: reg.id,
          contactId: reg.contactId,
          email: reg.email,
          fullName: reg.fullName,
          businessName: reg.businessName,
          status: reg.status,
          orderBumpPurchased: reg.orderBumpPurchased,
          createdAt: reg.createdAt,
          diagnosisScore: custom?.diagnosisScore ?? null,
          recommendedBrandPath: custom?.recommendedBrandPath ?? null,
          qualificationSubmitted: custom?.qualificationSubmitted ?? null,
          readyForCall: custom?.readyForCall ?? null,
        };
      })
    );
    return NextResponse.json({ leads: withContact });
  } catch (e) {
    console.error("Challenge leads list error:", e);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
