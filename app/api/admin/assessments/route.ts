import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV !== "production";

export async function GET(req: NextRequest) {
  try {
    const adminResult = await isAdmin(req);
    let sessionUser: Awaited<ReturnType<typeof getSessionUser>> = null;
    if (!adminResult) sessionUser = await getSessionUser(req);

    if (isDev) {
      const cookieHeader = req.headers.get("cookie") ?? "";
      const hasSessionCookie =
        /(?:^|;\s*)(?:sessionId|connect\.sid)=[^;]+/.test(cookieHeader);
      console.log(
        `[GET /api/admin/assessments] cookie present: ${hasSessionCookie ? "yes" : "no"}, isAdmin result: ${adminResult}`
      );
      if (!adminResult) {
        if (sessionUser) {
          const email = sessionUser.email ?? `${sessionUser.username}@?`;
          console.log(
            `[GET /api/admin/assessments] Session user: id=${sessionUser.id} email=${email} isAdmin=${sessionUser.isAdmin} adminApproved=${sessionUser.adminApproved}`
          );
          console.log(
            `[GET /api/admin/assessments] To fix: npx tsx scripts/create-admin.ts "${email}" <password> then log out and back in.`
          );
        } else {
          console.log(
            `[GET /api/admin/assessments] No session user found. Run: npx tsx scripts/create-session-table.ts then log out and log back in.`
          );
        }
      }
    }
    if (!adminResult) {
      return NextResponse.json(
        {
          message: "Admin access required",
          ...(isDev && !sessionUser && {
            hint: "Session not in database. Run: npx tsx scripts/create-session-table.ts then log out and log back in.",
          }),
        },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const summary = url.searchParams.get("summary") === "1";

    const assessments = await storage.getAllAssessments();

    if (summary) {
      const totalFromPb = (pb: unknown): number => {
        if (!pb || typeof pb !== "object") return 0;
        const o = pb as Record<string, unknown>;
        if (typeof o.total === "number") return o.total;
        const range = o.estimatedRange as { average?: number } | undefined;
        if (range && typeof range.average === "number") return range.average;
        if (typeof o.subtotal === "number") return o.subtotal;
        if (typeof o.basePrice === "number") return o.basePrice;
        return 0;
      };
      const list = assessments.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone ?? undefined,
        company: a.company ?? undefined,
        role: a.role ?? undefined,
        status: a.status,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        projectName:
          a.assessmentData && typeof a.assessmentData === "object" && "projectName" in a.assessmentData
            ? (a.assessmentData as { projectName?: string }).projectName
            : undefined,
        totalPrice: totalFromPb(a.pricingBreakdown),
      }));
      return NextResponse.json(list);
    }

    return NextResponse.json(assessments);
  } catch (error: any) {
    console.error("Error fetching assessments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}
