import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const body = await req.json();
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.dueAt !== undefined) updates.dueAt = body.dueAt ? new Date(body.dueAt) : null;
    if (body.completedAt !== undefined) updates.completedAt = body.completedAt ? new Date(body.completedAt) : body.completedAt === false ? null : undefined;
    if (body.completedNotes !== undefined) updates.completedNotes = body.completedNotes;
    const task = await storage.updateCrmTask(id, updates as any);
    return NextResponse.json(task);
  } catch (error: any) {
    console.error("CRM task update error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    await storage.deleteCrmTask(id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("CRM task delete error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
