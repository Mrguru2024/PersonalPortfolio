import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { humanizeBrevoApiError } from "@server/services/communications/brevoTransactional";

export const dynamic = "force-dynamic";

const AUTHORIZED_IPS_URL = "https://app.brevo.com/security/authorised_ips";

/** GET — env status for Brevo (keys are never returned, only hints). */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const key = process.env.BREVO_API_KEY?.trim();
    return NextResponse.json({
      brevoApiKeySet: Boolean(key),
      brevoApiKeyHint: key ? `…${key.slice(-4)}` : null,
      fromEmail: process.env.FROM_EMAIL?.trim() || null,
      fromName: process.env.FROM_NAME?.trim() || null,
      authorizedIpsUrl: AUTHORIZED_IPS_URL,
      envVarHelp: {
        brevoApiKey: "BREVO_API_KEY",
        fromEmail: "FROM_EMAIL (must be a verified sender in Brevo)",
        fromName: "FROM_NAME",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load Brevo settings" }, { status: 500 });
  }
}

/**
 * POST — verify API key against Brevo (GET /v3/account). Does not send email.
 * Body: {} optional
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const key = process.env.BREVO_API_KEY?.trim();
    if (!key) {
      return NextResponse.json(
        { ok: false, error: "BREVO_API_KEY is not set. Add it in your host (e.g. Vercel) environment variables." },
        { status: 400 }
      );
    }

    const res = await fetch("https://api.brevo.com/v3/account", {
      method: "GET",
      headers: {
        accept: "application/json",
        "api-key": key,
      },
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string; email?: string };
    if (!res.ok) {
      const raw = typeof data.message === "string" ? data.message : `Brevo API ${res.status}`;
      return NextResponse.json(
        { ok: false, error: humanizeBrevoApiError(raw), authorizedIpsUrl: AUTHORIZED_IPS_URL },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      accountEmail: typeof data.email === "string" ? data.email : null,
      message: "API key is valid. If sends still fail, check authorized IPs and verified senders in Brevo.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Connectivity check failed" }, { status: 500 });
  }
}
