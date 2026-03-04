import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@server/db";
import { websiteAudits } from "@shared/schema";
import {
  WEBSITE_AUDIT_STATUSES,
  type WebsiteAuditSubmission,
} from "@shared/websiteAuditSchema";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

type WebsiteAuditAdminMeta = {
  internalNotes?: string;
  updatedAt?: string;
  updatedBy?: string;
};

type WebsiteAuditDataWithMeta = WebsiteAuditSubmission & {
  __admin?: WebsiteAuditAdminMeta;
};

const updateSchema = z
  .object({
    status: z.enum(WEBSITE_AUDIT_STATUSES).optional(),
    internalNotes: z.string().max(10_000).optional(),
  })
  .refine((value) => value.status !== undefined || value.internalNotes !== undefined, {
    message: "At least one field (status or internalNotes) is required.",
  });

async function handleUpdate(
  req: NextRequest,
  params: Promise<{ id: string }>
): Promise<NextResponse> {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid website audit id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", message: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation error",
        message:
          parsed.error.errors?.[0]?.message ||
          "Status or internal notes are required.",
        details: parsed.error.errors,
      },
      { status: 400 }
    );
  }

  const existing = await db
    .select()
    .from(websiteAudits)
    .where(eq(websiteAudits.id, id))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Website audit not found" }, { status: 404 });
  }

  const current = existing[0];
  const currentAuditData =
    current.auditData && typeof current.auditData === "object"
      ? (current.auditData as WebsiteAuditDataWithMeta)
      : ({} as WebsiteAuditDataWithMeta);
  const currentAdminMeta =
    currentAuditData.__admin && typeof currentAuditData.__admin === "object"
      ? currentAuditData.__admin
      : {};

  const user = await getSessionUser(req);
  const nowIso = new Date().toISOString();
  const nextAdminMeta: WebsiteAuditAdminMeta = {
    ...currentAdminMeta,
    updatedAt: nowIso,
    ...(user?.username ? { updatedBy: user.username } : {}),
  };

  if (parsed.data.internalNotes !== undefined) {
    nextAdminMeta.internalNotes = parsed.data.internalNotes.trim();
  }

  const nextAuditData: WebsiteAuditDataWithMeta = {
    ...currentAuditData,
    __admin: nextAdminMeta,
  };

  const updates: Partial<typeof websiteAudits.$inferInsert> = {
    updatedAt: new Date(),
    auditData: nextAuditData,
  };

  if (parsed.data.status !== undefined) {
    updates.status = parsed.data.status;
  }

  try {
    const [updated] = await db
      .update(websiteAudits)
      .set(updates)
      .where(eq(websiteAudits.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("Error updating website audit:", error);
    return NextResponse.json(
      { error: "Failed to update website audit" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return handleUpdate(req, ctx.params);
}

// Fallback for environments that do not support PATCH well.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return handleUpdate(req, ctx.params);
}

