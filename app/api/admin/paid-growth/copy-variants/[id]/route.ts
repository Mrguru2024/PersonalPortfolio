import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { PPC_COPY_ANGLES } from "@shared/paidGrowthSchema";

export const dynamic = "force-dynamic";

function parseStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim());
}

function okAngle(s: unknown): s is (typeof PPC_COPY_ANGLES)[number] {
  return typeof s === "string" && (PPC_COPY_ANGLES as readonly string[]).includes(s);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const body = await req.json().catch(() => ({}));
    const updates: Parameters<typeof storage.updatePpcAdCopyVariant>[1] = {};
    if (typeof body.label === "string") updates.label = body.label.trim();
    if (okAngle(body.copyAngle)) updates.copyAngle = body.copyAngle;
    const h = parseStringArray(body.headlinesJson);
    if (h) updates.headlinesJson = h;
    const p = parseStringArray(body.primaryTextsJson);
    if (p) updates.primaryTextsJson = p;
    const d = parseStringArray(body.descriptionsJson);
    if (d) updates.descriptionsJson = d;
    const c = parseStringArray(body.ctasJson);
    if (c) updates.ctasJson = c;
    if (typeof body.sortOrder === "number") updates.sortOrder = body.sortOrder;
    if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
    if (typeof body.adGroupId === "number") updates.adGroupId = body.adGroupId;
    if (body.adGroupId === null) updates.adGroupId = null;
    const updated = await storage.updatePpcAdCopyVariant(id, updates);
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    await storage.deletePpcAdCopyVariant(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
