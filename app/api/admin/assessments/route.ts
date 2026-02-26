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

    const assessments = await storage.getAllAssessments();
    return NextResponse.json(assessments);
  } catch (error: any) {
    console.error("Error fetching assessments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}
