import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import {
  listInternalNotes,
  createInternalNote,
  logGosAccessEvent,
} from "@server/services/growthOsFoundationService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const listQuerySchema = z.object({
  resourceType: z.string().min(1).max(120),
  resourceId: z.string().min(1).max(256),
});

const createBodySchema = z.object({
  resourceType: z.string().min(1).max(120),
  resourceId: z.string().min(1).max(256),
  body: z.string().min(1).max(20000),
});

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const parsed = listQuerySchema.safeParse({
      resourceType: searchParams.get("resourceType") ?? "",
      resourceId: searchParams.get("resourceId") ?? "",
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const rows = await listInternalNotes(parsed.data.resourceType, parsed.data.resourceId);
    return NextResponse.json({ notes: rows });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[GET /api/admin/growth-os/internal-notes]", msg);
    return NextResponse.json(
      { error: "Server error", message: "Failed to list internal notes" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 },
      );
    }

    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Session user missing id" },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = createBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const row = await createInternalNote({
      ...parsed.data,
      authorUserId: user.id,
    });

    await logGosAccessEvent({
      actorUserId: user.id,
      action: "internal_note_created",
      resourceType: parsed.data.resourceType,
      resourceId: parsed.data.resourceId,
      visibilityContext: "internal_only",
      metadata: { noteId: row.id },
    });

    return NextResponse.json({ note: row });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[POST /api/admin/growth-os/internal-notes]", msg);
    return NextResponse.json(
      { error: "Server error", message: "Failed to create internal note" },
      { status: 500 },
    );
  }
}
