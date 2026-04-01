import { NextRequest, NextResponse } from "next/server";
import { requireEmailHubSession } from "../lib/session";

export const dynamic = "force-dynamic";

/** Non-secret Email Hub settings derived from env (Brevo connection is exercised on send). */
export async function GET(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    brevoApiConfigured: Boolean(process.env.BREVO_API_KEY?.trim()),
    fromEmail: process.env.FROM_EMAIL?.trim() ?? "",
    fromName: process.env.FROM_NAME?.trim() ?? "",
    webhookSecretConfigured: Boolean(process.env.BREVO_WEBHOOK_SECRET?.trim()),
    defaultReplyTo: process.env.BREVO_DEFAULT_REPLY_TO?.trim() ?? process.env.FROM_EMAIL?.trim() ?? "",
    trackingDomain: process.env.BREVO_TRACKING_DOMAIN?.trim() ?? "",
    /** Document-only sender ids for mapping founders (optional). */
    brevoSenderEnvKeys: ["BREVO_SENDER_ANTHONY_ID", "BREVO_SENDER_KRIS_ID", "BREVO_SENDER_DENISHIA_ID"].filter(
      (k) => process.env[k]?.trim(),
    ),
    isSuper: user.isSuper,
  });
}
