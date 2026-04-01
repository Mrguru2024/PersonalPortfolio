import { NextRequest, NextResponse } from "next/server";
import { requireEmailHubSession } from "../lib/session";
import { getEmailHubTrackingPayload, upsertEmailHubUserPrefs } from "@server/services/emailHub/emailHubTracking";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = await getEmailHubTrackingPayload(user);
  return NextResponse.json(payload);
}

export async function PATCH(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: {
    defaultTrackingOpen?: boolean;
    defaultTrackingClick?: boolean;
    defaultUnsubFooter?: boolean;
  } = {};

  if ("defaultTrackingOpen" in body) {
    if (typeof body.defaultTrackingOpen !== "boolean") {
      return NextResponse.json({ error: "defaultTrackingOpen must be boolean" }, { status: 400 });
    }
    patch.defaultTrackingOpen = body.defaultTrackingOpen;
  }
  if ("defaultTrackingClick" in body) {
    if (typeof body.defaultTrackingClick !== "boolean") {
      return NextResponse.json({ error: "defaultTrackingClick must be boolean" }, { status: 400 });
    }
    patch.defaultTrackingClick = body.defaultTrackingClick;
  }
  if ("defaultUnsubFooter" in body) {
    if (typeof body.defaultUnsubFooter !== "boolean") {
      return NextResponse.json({ error: "defaultUnsubFooter must be boolean" }, { status: 400 });
    }
    patch.defaultUnsubFooter = body.defaultUnsubFooter;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  await upsertEmailHubUserPrefs(user.id, patch);
  const payload = await getEmailHubTrackingPayload(user);
  return NextResponse.json(payload);
}
