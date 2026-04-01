import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { getAfnNextBestAction } from "@server/services/afnNextBestActionService";

export const dynamic = "force-dynamic";

/** GET /api/community/next-best-action */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const action = await getAfnNextBestAction(Number(user.id));
    return NextResponse.json({ action });
  } catch (e) {
    console.error("GET next-best-action error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
