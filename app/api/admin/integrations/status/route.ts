import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { isZoomConfigured } from "@/lib/zoom";
import {
  isGoogleCalendarConnected,
  isGoogleCalendarOAuthConfigured,
} from "@server/services/googleCalendarSchedulingService";
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

    const gcalEnv = isGoogleCalendarOAuthConfigured();
    const gcalConnected = await isGoogleCalendarConnected();

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
      {
        id: "google_calendar",
        name: "Google Calendar (scheduling sync)",
        description:
          "OAuth: new Ascendra bookings create events on your Google calendar. Disconnect anytime from Integrations.",
        configured: gcalEnv && gcalConnected,
        status: gcalConnected ? "ok" : gcalEnv ? "not_configured" : "not_configured",
        message: gcalConnected
          ? "Connected — new /book confirmations sync as calendar events."
          : gcalEnv
            ? "OAuth client is set — click Connect Google Calendar to authorize."
            : "Set GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET, add redirect URI in Google Cloud, then connect.",
        reconnectUrl: "https://console.cloud.google.com/apis/credentials",
        connectHref: gcalEnv && !gcalConnected ? "/api/admin/integrations/google-calendar/start" : undefined,
      },
      {
        id: "calendly",
        name: "Calendly (fallback URL)",
        description: "Optional external scheduler URL for Revenue Ops SMS or redirects while native scheduling rolls out.",
        configured: !!process.env.CALENDLY_API_TOKEN?.trim(),
        status: process.env.CALENDLY_API_TOKEN?.trim() ? "ok" : "not_configured",
        message: process.env.CALENDLY_API_TOKEN?.trim()
          ? "API token set (use for import/sync tooling when implemented)."
          : "Optional: CALENDLY_API_TOKEN for future Calendly bridge.",
        reconnectUrl: "https://calendly.com/integrations/api_webhooks",
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
