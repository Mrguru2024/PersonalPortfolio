import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { testZoomConnection } from "@/lib/zoom";
import { testGoogleCalendarConnection } from "@server/services/googleCalendarSchedulingService";
import type { IntegrationId } from "../types";
import {
  hasFacebookPagePublishConfig,
  hasLinkedInPublishConfig,
  hasThreadsPublishConfig,
  hasXPublishConfig,
  hasWebhookPublishConfig,
} from "@server/services/internalStudio/publishAdapters";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/integrations/test
 * Body: { service: IntegrationId }
 * Super user only. Runs a quick test for the given service (e.g. Facebook app config validation).
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isSuperUser(req))) {
      return NextResponse.json(
        { message: "Sign in with the site owner account." },
        { status: 403 }
      );
    }

    let body: { service?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const service = body.service as IntegrationId | undefined;
    if (
      !service ||
      !["facebook", "brevo", "zoom", "social-scheduling", "google_calendar", "calendly"].includes(service)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "That service name isn’t recognized.",
        },
        { status: 400 }
      );
    }

    if (service === "facebook") {
      const appId = process.env.FACEBOOK_APP_ID;
      const appSecret = process.env.FACEBOOK_APP_SECRET;
      if (!appId || !appSecret) {
        return NextResponse.json({
          ok: false,
          message: "Facebook isn’t configured yet. Add your Meta app ID and secret in the site settings.",
        });
      }
      return NextResponse.json({
        ok: true,
        message:
          "Meta app ID and secret are saved. In Meta’s app settings, add the return link from Connections & email (yellow box).",
      });
    }

    if (service === "brevo") {
      const apiKey = process.env.BREVO_API_KEY;
      if (!apiKey) {
        return NextResponse.json({
          ok: false,
          message: "Brevo not configured. Set BREVO_API_KEY.",
        });
      }
      try {
        const res = await fetch("https://api.brevo.com/v3/account", {
          headers: { "api-key": apiKey },
          cache: "no-store",
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { message?: string };
          return NextResponse.json({
            ok: false,
            message: err.message ?? `Brevo API returned ${res.status}. Check your API key.`,
          });
        }
        return NextResponse.json({
          ok: true,
          message: "Brevo API key is valid. You can send transactional emails.",
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({
          ok: false,
          message: `Could not reach Brevo: ${msg}.`,
        });
      }
    }

    if (service === "zoom") {
      const result = await testZoomConnection();
      return NextResponse.json(result);
    }

    if (service === "social-scheduling") {
      const parts = [
        (await hasFacebookPagePublishConfig()) ? "Facebook Page" : null,
        (await hasLinkedInPublishConfig()) ? "LinkedIn" : null,
        (await hasXPublishConfig()) ? "X" : null,
        (await hasThreadsPublishConfig()) ? "Threads" : null,
        hasWebhookPublishConfig() ? "Automation webhook" : null,
      ].filter((x): x is string => x != null);
      if (parts.length === 0) {
        return NextResponse.json({
          ok: false,
          message:
            "No social channel is ready yet. Connect a Facebook Page, LinkedIn, X, or Threads under Connections & email, or ask your host to set posting keys. A webhook URL is another option.",
        });
      }
      return NextResponse.json({
        ok: true,
        message: `Saved settings look ready for: ${parts.join(", ")}. Schedule a test post from the content calendar to confirm it goes live.`,
      });
    }

    if (service === "google_calendar") {
      const r = await testGoogleCalendarConnection();
      return NextResponse.json(r);
    }

    if (service === "calendly") {
      const tok = process.env.CALENDLY_API_TOKEN?.trim();
      if (!tok) {
        return NextResponse.json({
          ok: false,
          message: "Calendly isn’t configured (optional).",
        });
      }
      return NextResponse.json({
        ok: true,
        message: "Calendly token is saved.",
      });
    }

    return NextResponse.json({ ok: false, message: "Unknown service." }, { status: 400 });
  } catch (error) {
    console.error("Integrations test error:", error);
    return NextResponse.json(
      { message: "Could not run the test. Try again." },
      { status: 500 }
    );
  }
}
