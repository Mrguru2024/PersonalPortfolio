import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/**
 * Export assessments as JSON for backup. GET ?includeDeleted=1 to include soft-deleted.
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }
    const url = new URL(req.url);
    const includeDeleted = url.searchParams.get("includeDeleted") === "1";

    const active = await storage.getAllAssessments();
    const deleted = includeDeleted ? await storage.getDeletedAssessments() : [];
    const payload = {
      exportedAt: new Date().toISOString(),
      active: active.length,
      deleted: deleted.length,
      assessments: [...active, ...deleted].map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone ?? null,
        company: a.company ?? null,
        role: a.role ?? null,
        assessmentData: a.assessmentData,
        pricingBreakdown: a.pricingBreakdown,
        status: a.status,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        deletedAt: a.deletedAt ?? null,
      })),
    };

    return NextResponse.json(payload, {
      headers: {
        "Content-Disposition": `attachment; filename="assessments-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error: unknown) {
    console.error("Error exporting assessments:", error);
    return NextResponse.json(
      { error: "Failed to export assessments" },
      { status: 500 }
    );
  }
}
