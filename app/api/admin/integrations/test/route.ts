import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { testZoomConnection } from "@/lib/zoom";
import type { IntegrationId } from "../types";

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
        { message: "Super user access required" },
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
    if (!service || !["facebook", "brevo", "zoom", "social-scheduling"].includes(service)) {
      return NextResponse.json(
        { ok: false, message: "Missing or invalid service. Use: facebook, brevo, zoom, or social-scheduling." },
        { status: 400 }
      );
    }

    if (service === "facebook") {
      const appId = process.env.FACEBOOK_APP_ID;
      const appSecret = process.env.FACEBOOK_APP_SECRET;
      if (!appId || !appSecret) {
        return NextResponse.json({
          ok: false,
          message: "Facebook App not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.",
        });
      }
      return NextResponse.json({
        ok: true,
        message: "Facebook App ID and Secret are set. Ensure Valid OAuth Redirect URIs are configured in Facebook Developer Console.",
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
      return NextResponse.json({
        ok: false,
        message: "Social scheduling is not yet connected. Connect Facebook and other platforms above first.",
      });
    }

    return NextResponse.json({ ok: false, message: "Unknown service." }, { status: 400 });
  } catch (error) {
    console.error("Integrations test error:", error);
    return NextResponse.json(
      { message: "Failed to run test" },
      { status: 500 }
    );
  }
}
