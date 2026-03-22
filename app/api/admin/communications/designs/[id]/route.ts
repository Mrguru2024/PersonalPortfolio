import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const row = await storage.getCommEmailDesignById(id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load design" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const body = await req.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.subject === "string") updates.subject = body.subject.trim();
    if (typeof body.previewText === "string") updates.previewText = body.previewText;
    if (typeof body.htmlContent === "string") updates.htmlContent = body.htmlContent;
    if (typeof body.plainText === "string") updates.plainText = body.plainText;
    if (Array.isArray(body.blocksJson)) updates.blocksJson = body.blocksJson;
    if (body.organizationId !== undefined) {
      updates.organizationId =
        body.organizationId != null && body.organizationId !== "" ? Number(body.organizationId) : null;
    }
    if (typeof body.category === "string") updates.category = body.category;
    if (Array.isArray(body.personaIdsJson)) updates.personaIdsJson = body.personaIdsJson.map(String);
    if (typeof body.senderName === "string") updates.senderName = body.senderName;
    if (body.status === "published" || body.status === "draft") updates.status = body.status;
    const row = await storage.updateCommEmailDesign(id, updates as Parameters<typeof storage.updateCommEmailDesign>[1]);
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update design" }, { status: 500 });
  }
}
