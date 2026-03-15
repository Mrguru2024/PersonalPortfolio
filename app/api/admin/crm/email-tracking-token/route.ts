import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { signEmailTrackingPayload } from "@/lib/track-email";

export const dynamic = "force-dynamic";

/** POST /api/admin/crm/email-tracking-token — generate tracking token for email (pixel + click URLs). */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const leadId = Number(body.leadId);
    const emailId = typeof body.emailId === "string" ? body.emailId.trim() : "";
    if (!leadId || !emailId) {
      return NextResponse.json({ error: "leadId and emailId required" }, { status: 400 });
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl?.origin || "http://localhost:3000";
    const token = signEmailTrackingPayload(leadId, emailId);
    const pixelUrl = `${baseUrl}/api/track/email/open?token=${encodeURIComponent(token)}`;
    const clickUrl = (destinationUrl: string) =>
      `${baseUrl}/api/track/email/click?token=${encodeURIComponent(token)}&url=${encodeURIComponent(destinationUrl)}`;
    return NextResponse.json({
      token,
      pixelUrl,
      clickUrlTemplate: `${baseUrl}/api/track/email/click?token=${encodeURIComponent(token)}&url=`,
      clickUrl,
    });
  } catch (error: any) {
    console.error("Email tracking token error:", error);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
