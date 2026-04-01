import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { processScheduledEmailHubDrafts, processScheduledEmailHubMessages } from "@server/services/emailHub/emailHubService";
import { MIN_CRON_SECRET_LENGTH } from "@shared/production-security-env";

function cronBearerMatches(authHeader: string | null, secret: string): boolean {
  const prefix = "Bearer ";
  if (!authHeader || !authHeader.startsWith(prefix)) return false;
  const token = authHeader.slice(prefix.length).trim();
  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(secret, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/cron/email-hub-scheduled
 * Sends Email Hub rows with status scheduled and scheduledFor <= now; runs scheduled drafts through the same pipeline.
 * Vercel Cron: CRON_SECRET in project env; platform sends Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) {
      return NextResponse.json(
        {
          error: "CRON_SECRET is not configured",
          hint: "Add CRON_SECRET so Vercel Cron can authorize scheduled Email Hub sends.",
        },
        { status: 503 },
      );
    }
    if (secret.length < MIN_CRON_SECRET_LENGTH) {
      return NextResponse.json(
        {
          error: "CRON_SECRET too short",
          hint: `Use at least ${MIN_CRON_SECRET_LENGTH} characters (e.g. openssl rand -hex 24).`,
        },
        { status: 503 },
      );
    }
    const auth = req.headers.get("authorization");
    if (!cronBearerMatches(auth, secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const msgs = await processScheduledEmailHubMessages();
    const drafts = await processScheduledEmailHubDrafts();
    return NextResponse.json({ ok: true, ...msgs, ...drafts });
  } catch (e: unknown) {
    console.error("[cron/email-hub-scheduled]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
