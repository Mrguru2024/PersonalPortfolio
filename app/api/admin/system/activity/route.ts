import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { db } from "@server/db";
import { contacts, projectAssessments, crmContacts } from "@shared/schema";
import { desc, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

function isMissingDeletedAtColumn(error: unknown): boolean {
  const msg = String(error instanceof Error ? error.message : error).toLowerCase();
  return msg.includes("deleted_at") || (msg.includes("column") && msg.includes("does not exist"));
}

function toIso(d: unknown): string {
  if (d instanceof Date) return d.toISOString();
  if (typeof d === "string") return d;
  return String(d);
}

/**
 * GET /api/admin/system/activity
 * Super user only. Latest rows by createdAt (not full-table scan + slice).
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isSuperUser(req))) {
      return NextResponse.json({ message: "Super user access required" }, { status: 403 });
    }

    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 5, 20);

    const recentContacts = await db
      .select({
        id: contacts.id,
        name: contacts.name,
        email: contacts.email,
        subject: contacts.subject,
        createdAt: contacts.createdAt,
      })
      .from(contacts)
      .orderBy(desc(contacts.createdAt))
      .limit(limit);

    let recentAssessments: {
      id: number;
      name: string;
      email: string;
      status: string | null;
      createdAt: unknown;
    }[] = [];
    try {
      recentAssessments = await db
        .select({
          id: projectAssessments.id,
          name: projectAssessments.name,
          email: projectAssessments.email,
          status: projectAssessments.status,
          createdAt: projectAssessments.createdAt,
        })
        .from(projectAssessments)
        .where(isNull(projectAssessments.deletedAt))
        .orderBy(desc(projectAssessments.createdAt))
        .limit(limit);
    } catch (e) {
      if (!isMissingDeletedAtColumn(e)) throw e;
      recentAssessments = await db
        .select({
          id: projectAssessments.id,
          name: projectAssessments.name,
          email: projectAssessments.email,
          status: projectAssessments.status,
          createdAt: projectAssessments.createdAt,
        })
        .from(projectAssessments)
        .orderBy(desc(projectAssessments.createdAt))
        .limit(limit);
    }

    const recentCrmContacts = await db
      .select({
        id: crmContacts.id,
        name: crmContacts.name,
        email: crmContacts.email,
        source: crmContacts.source,
        createdAt: crmContacts.createdAt,
      })
      .from(crmContacts)
      .orderBy(desc(crmContacts.createdAt))
      .limit(limit);

    return NextResponse.json({
      recentContacts: recentContacts.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        subject: c.subject,
        createdAt: toIso(c.createdAt),
      })),
      recentAssessments: recentAssessments.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        status: a.status ?? "",
        createdAt: toIso(a.createdAt),
      })),
      recentCrmContacts: recentCrmContacts.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        source: c.source ?? "(none)",
        createdAt: toIso(c.createdAt),
      })),
    });
  } catch (error) {
    console.error("System activity error:", error);
    return NextResponse.json({ message: "Failed to get activity" }, { status: 500 });
  }
}
