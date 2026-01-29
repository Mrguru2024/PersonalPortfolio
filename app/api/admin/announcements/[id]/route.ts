import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { z } from "zod";

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  type: z.enum(["info", "warning", "success", "update"]).optional(),
  isActive: z.boolean().optional(),
  targetAudience: z.enum(["all", "specific_users", "specific_projects"]).optional(),
  targetUserIds: z.array(z.number()).optional().nullable(),
  targetProjectIds: z.array(z.number()).optional().nullable(),
  expiresAt: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).nullable(),
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const announcement = await storage.getAnnouncementById(id);
    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }
    return NextResponse.json(announcement);
  } catch (error: any) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json({ error: "Failed to fetch announcement" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const existing = await storage.getAnnouncementById(id);
    if (!existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }
    const body = await req.json();
    const data = updateAnnouncementSchema.parse(body);
    const updates: Record<string, unknown> = { ...data };
    if (data.expiresAt !== undefined) {
      updates.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }
    const announcement = await storage.updateAnnouncement(id, updates as any);
    return NextResponse.json(announcement);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error updating announcement:", error);
    return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 });
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
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const existing = await storage.getAnnouncementById(id);
    if (!existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }
    await storage.deleteAnnouncement(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}
