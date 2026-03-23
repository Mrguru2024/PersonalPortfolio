import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

function parseId(params: { id: string }): number | null {
  const n = Number(params.id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** PATCH /api/admin/agent/knowledge/[id] */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const userId = user?.id != null ? Number(user.id) : null;
    if (userId == null) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }
    const { id: idParam } = await params;
    const id = parseId({ id: idParam });
    if (id == null) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const updates: Parameters<typeof storage.updateAdminAgentKnowledgeEntry>[2] = {};
    if (typeof body.title === "string") {
      const t = body.title.trim().slice(0, 200);
      if (t) updates.title = t;
    }
    if (typeof body.body === "string") {
      const b = body.body.trim().slice(0, 50_000);
      if (b) updates.body = b;
    }
    if (typeof body.useInAgent === "boolean") updates.useInAgent = body.useInAgent;
    if (typeof body.useInResearch === "boolean") updates.useInResearch = body.useInResearch;
    if (typeof body.useInMessages === "boolean") updates.useInMessages = body.useInMessages;
    if (Object.keys(updates).length === 0) {
      const row = await storage.getAdminAgentKnowledgeEntry(userId, id);
      if (!row) return NextResponse.json({ message: "Not found" }, { status: 404 });
      return NextResponse.json({ entry: row });
    }
    const row = await storage.updateAdminAgentKnowledgeEntry(userId, id, updates);
    if (!row) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ entry: row });
  } catch (e) {
    console.error("PATCH admin agent knowledge error:", e);
    return NextResponse.json({ message: "Failed to update" }, { status: 500 });
  }
}

/** DELETE /api/admin/agent/knowledge/[id] */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const userId = user?.id != null ? Number(user.id) : null;
    if (userId == null) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }
    const { id: idParam } = await params;
    const id = parseId({ id: idParam });
    if (id == null) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }
    const ok = await storage.deleteAdminAgentKnowledgeEntry(userId, id);
    if (!ok) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE admin agent knowledge error:", e);
    return NextResponse.json({ message: "Failed to delete" }, { status: 500 });
  }
}
