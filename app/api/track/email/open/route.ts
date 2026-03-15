import { NextRequest, NextResponse } from "next/server";
import { verifyEmailTrackingToken } from "@/lib/track-email";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

const PIXEL_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

/** GET /api/track/email/open?token=... — tracking pixel for email opens. No auth. */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return new NextResponse(PIXEL_GIF, {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }
    const parsed = verifyEmailTrackingToken(token);
    if (parsed) {
      const contact = await storage.getCrmContactById(parsed.leadId);
      if (contact) {
        const ua = req.headers.get("user-agent") || undefined;
        const deviceType = ua && /Mobile|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";
        await storage.createCommunicationEvent({
          leadId: parsed.leadId,
          eventType: "open",
          emailId: parsed.emailId,
          ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined,
          userAgent: ua,
          deviceType,
        });
      }
    }
    return new NextResponse(PIXEL_GIF, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return new NextResponse(PIXEL_GIF, {
      headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" },
    });
  }
}
