import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { z } from "zod";

const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(["info", "warning", "success", "update"]).optional(),
  targetAudience: z.enum(["all", "specific_users", "specific_projects"]).optional(),
  targetUserIds: z.array(z.number()).optional(),
  targetProjectIds: z.array(z.number()).optional(),
  expiresAt: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).nullable(),
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const announcements = await storage.getAllAnnouncements();
    return NextResponse.json(announcements);
  } catch (error: any) {
    console.error("Error fetching announcements:", error);
    const message =
      process.env.NODE_ENV === "development" && error?.message
        ? error.message
        : "Failed to fetch announcements";
    return NextResponse.json(
      { error: "Failed to fetch announcements", details: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const data = createAnnouncementSchema.parse(body);
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : undefined;
    const targetUserIds = Array.isArray(data.targetUserIds) && data.targetUserIds.length > 0 ? data.targetUserIds : undefined;
    const targetProjectIds = Array.isArray(data.targetProjectIds) && data.targetProjectIds.length > 0 ? data.targetProjectIds : undefined;
    const announcement = await storage.createAnnouncement({
      title: data.title,
      content: data.content,
      type: data.type ?? "info",
      isActive: true,
      targetAudience: data.targetAudience ?? "all",
      ...(targetUserIds != null && { targetUserIds }),
      ...(targetProjectIds != null && { targetProjectIds }),
      ...(expiresAt != null && { expiresAt }),
    });
    return NextResponse.json(announcement, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error creating announcement:", error);
    const details = process.env.NODE_ENV === "development" && error?.message ? error.message : undefined;
    return NextResponse.json(
      { error: "Failed to create announcement", ...(details && { details }) },
      { status: 500 }
    );
  }
}
