import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const body = await req.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};
    if (typeof body.nickname === "string") updates.nickname = body.nickname.trim();
    if (typeof body.externalAccountId === "string") updates.externalAccountId = body.externalAccountId.trim();
    if (typeof body.managerCustomerId === "string") updates.managerCustomerId = body.managerCustomerId.trim();
    if (typeof body.status === "string") updates.status = body.status;
    if (typeof body.isDefault === "boolean") updates.isDefault = body.isDefault;
    if (body.metadata && typeof body.metadata === "object") updates.metadata = body.metadata;
    const row = await storage.updatePpcAdAccount(id, updates as Parameters<typeof storage.updatePpcAdAccount>[1]);
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
