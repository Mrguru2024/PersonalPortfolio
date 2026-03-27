import { NextRequest, NextResponse } from "next/server";
import { createEmailHubAsset, listEmailHubAssets } from "@server/services/emailHub/emailHubService";
import { requireEmailHubSession } from "../lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const assets = await listEmailHubAssets(user.id, user.isSuper);
  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const row = await createEmailHubAsset({
      ownerUserId: user.isSuper && body.ownerUserId != null ? Number(body.ownerUserId) : user.id,
      brandProfileId: body.brandProfileId != null ? Number(body.brandProfileId) : null,
      name: String(body.name ?? "asset"),
      fileUrl: String(body.fileUrl ?? ""),
      mimeType: body.mimeType != null ? String(body.mimeType) : null,
      altText: body.altText != null ? String(body.altText) : null,
      tags: Array.isArray(body.tags) ? (body.tags as string[]).map(String) : [],
      category: body.category != null ? String(body.category) : null,
    });
    return NextResponse.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
