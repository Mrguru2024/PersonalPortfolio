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
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const data = createAnnouncementSchema.parse(body);
    const announcement = await storage.createAnnouncement({
      title: data.title,
      content: data.content,
      type: data.type ?? "info",
      isActive: true,
      targetAudience: data.targetAudience ?? "all",
      targetUserIds: data.targetUserIds ?? null,
      targetProjectIds: data.targetProjectIds ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    });
    return NextResponse.json(announcement, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error creating announcement:", error);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}
