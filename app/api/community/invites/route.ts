import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { createAfnInviteRow } from "@server/afnStorage";
import { fireAndForgetAfnIntelligence } from "@server/services/afnIntelligenceService";

export const dynamic = "force-dynamic";

/** POST /api/community/invites — record peer invite (Phase 7); delivery is out-of-band (email product). */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const email = typeof body.inviteeEmail === "string" ? body.inviteeEmail.trim().toLowerCase().slice(0, 320) : "";
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid inviteeEmail required" }, { status: 400 });
    }
    const sourceMoment = typeof body.sourceMoment === "string" ? body.sourceMoment.slice(0, 120) : "manual";
    const row = await createAfnInviteRow({
      inviterUserId: Number(user.id),
      inviteeEmail: email,
      status: "sent",
      sourceMoment,
      metadata: typeof body.metadata === "object" && body.metadata ? body.metadata : undefined,
    });
    fireAndForgetAfnIntelligence(Number(user.id));
    return NextResponse.json({ invite: row });
  } catch (e) {
    console.error("POST community invites error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
