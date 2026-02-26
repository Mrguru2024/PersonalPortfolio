import { NextResponse } from "next/server";

/**
 * GET /api/health/email
 * Returns email notification config status (no secrets).
 * Use this to verify BREVO_API_KEY, ADMIN_EMAIL, and FROM_EMAIL are set in the running environment.
 */
export async function GET() {
  const brevoKey = process.env.BREVO_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail =
    process.env.FROM_EMAIL || process.env.BREVO_FROM_EMAIL;

  return NextResponse.json({
    configured: !!brevoKey,
    admin: adminEmail ? "set" : "not set",
    fromEmail: fromEmail ? "set" : "not set",
    ready: !!brevoKey && !!adminEmail && !!fromEmail,
  });
}
