import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession, getSessionUser, getIpAddress } from "@/lib/auth-helpers";
import { recordActivityLog } from "@server/activityLog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const cookieStore = await cookies();
    const sessionId =
      cookieStore.get("sessionId")?.value ||
      cookieStore.get("connect.sid")?.value;

    if (sessionId) {
      deleteSession(sessionId);
    }

    if (user?.id) {
      recordActivityLog("logout", true, {
        userId: user.id,
        identifier: user.username,
        ipAddress: getIpAddress(req),
        userAgent: req.headers.get("user-agent") ?? undefined,
      }).catch(() => {});
    }

    const response = NextResponse.json({ message: "Logged out successfully" });
    response.cookies.delete("sessionId");
    response.cookies.delete("connect.sid");

    return response;
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { message: "Error during logout" },
      { status: 500 },
    );
  }
}
