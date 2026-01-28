import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId =
      cookieStore.get("sessionId")?.value ||
      cookieStore.get("connect.sid")?.value;

    if (sessionId) {
      deleteSession(sessionId);
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
