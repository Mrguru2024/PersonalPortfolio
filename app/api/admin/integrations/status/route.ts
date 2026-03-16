import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { isZoomConfigured } from "@/lib/zoom";
import type { IntegrationStatus } from "../types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/integrations/status
 * Super user only. Returns status of each integrated service (env/config only; no live API calls).
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isSuperUser(req))) {
      return NextResponse.json(
        { message: "Super user access required" },
        { status: 403 }
      );
    }

    const services: IntegrationStatus[] = [
      {
        id: "facebook",
        name: "Facebook App (Login)",
        description: "Facebook Login for Ascendra; used for OAuth and app features.",
        configured: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
        status: process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET ? "ok" : "not_configured",
        message: process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET
          ? `App ID configured (${String(process.env.FACEBOOK_APP_ID).slice(0, 8)}…)`
          : "Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in environment.",
        reconnectUrl: "https://developers.facebook.com/apps/",
      },
      {
        id: "brevo",
        name: "Brevo (Email)",
        description: "Transactional email for contact form, notifications, and newsletters.",
        configured: !!process.env.BREVO_API_KEY,
        status: process.env.BREVO_API_KEY ? "ok" : "not_configured",
        message: process.env.BREVO_API_KEY
          ? "API key set"
          : "Set BREVO_API_KEY in environment.",
        reconnectUrl: "https://app.brevo.com/settings/keys/api",
      },
      {
        id: "zoom",
        name: "Zoom (Meetings)",
        description: "Schedule and start Zoom meetings from CRM lead profiles.",
        configured: isZoomConfigured(),
        status: isZoomConfigured() ? "ok" : "not_configured",
        message: isZoomConfigured()
          ? "Server-to-Server OAuth configured"
          : "Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET. Create a S2S OAuth app at marketplace.zoom.us.",
        reconnectUrl: "https://marketplace.zoom.us/",
      },
      {
        id: "social-scheduling",
        name: "Social post scheduling",
        description: "Schedule posts to Facebook, LinkedIn, and other platforms from Ascendra.",
        configured: false,
        status: "not_configured",
        message: "Connect accounts below to enable scheduling.",
      },
    ];

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Integrations status error:", error);
    return NextResponse.json(
      { message: "Failed to get integrations status" },
      { status: 500 }
    );
  }
}
