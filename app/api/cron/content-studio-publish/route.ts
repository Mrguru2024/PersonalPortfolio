import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { runScheduledContentStudioPublishes } from "@server/services/internalStudio/workflowService";
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
 * GET /api/cron/content-studio-publish?projectKey=ascendra_main
 * Publishes editorial calendar rows with calendarStatus=scheduled, scheduledAt <= now, linked document, platform targets.
 * Same CRON_SECRET Bearer as other Vercel crons.
 */
export async function GET(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) {
      return NextResponse.json(
        { error: "CRON_SECRET is not configured", hint: "Add CRON_SECRET for scheduled jobs." },
        { status: 503 },
      );
    }
    if (secret.length < MIN_CRON_SECRET_LENGTH) {
      return NextResponse.json(
        {
          error: "CRON_SECRET too short",
          hint: `Use at least ${MIN_CRON_SECRET_LENGTH} characters.`,
        },
        { status: 503 },
      );
    }
    const auth = req.headers.get("authorization");
    if (!cronBearerMatches(auth, secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectKey = req.nextUrl.searchParams.get("projectKey") ?? "ascendra_main";
    const out = await runScheduledContentStudioPublishes({ projectKey });
    return NextResponse.json({ ok: true, projectKey, ...out });
  } catch (e: unknown) {
    console.error("[cron/content-studio-publish]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
