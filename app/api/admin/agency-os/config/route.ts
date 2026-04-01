import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { agencyOsAdminTaskAcceptanceAllowed } from "@server/services/agencyOs/agencyOsService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const user = await getSessionUser(req);
  if (!user?.adminApproved) {
    return NextResponse.json({ message: "Approved admin required" }, { status: 403 });
  }
  return NextResponse.json({
    adminTaskAcceptanceAllowed: agencyOsAdminTaskAcceptanceAllowed(),
  });
}
