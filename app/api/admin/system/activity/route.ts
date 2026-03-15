import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/system/activity
 * Super user only. Returns recent contacts, assessments, and CRM contacts for at-a-glance monitoring.
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isSuperUser(req))) {
      return NextResponse.json(
        { message: "Super user access required" },
        { status: 403 }
      );
    }

    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 5, 20);

    const [contacts, assessments, crmContacts] = await Promise.all([
      storage.getAllContacts(),
      storage.getAllAssessments(),
      storage.getCrmContacts(),
    ]);

    const formatContact = (c: { id: number; name: string; email: string; subject: string; createdAt: unknown }) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      subject: c.subject,
      createdAt: typeof c.createdAt === "string" ? c.createdAt : (c.createdAt as Date)?.toISOString?.() ?? String(c.createdAt),
    });

    const formatAssessment = (a: { id: number; name: string; email: string; status: string; createdAt: unknown }) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      status: a.status,
      createdAt: (a.createdAt as Date)?.toISOString?.() ?? String(a.createdAt),
    });

    const formatCrm = (c: { id: number; name: string; email: string; source: string | null; createdAt: unknown }) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      source: c.source ?? "(none)",
      createdAt: (c.createdAt as Date)?.toISOString?.() ?? String(c.createdAt),
    });

    return NextResponse.json({
      recentContacts: contacts.slice(0, limit).map(formatContact),
      recentAssessments: assessments.slice(0, limit).map(formatAssessment),
      recentCrmContacts: crmContacts.slice(0, limit).map(formatCrm),
    });
  } catch (error) {
    console.error("System activity error:", error);
    return NextResponse.json(
      { message: "Failed to get activity" },
      { status: 500 }
    );
  }
}
