import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV !== "production";

// Get all newsletters
export async function GET(req: NextRequest) {
  try {
    const adminResult = await isAdmin(req);
    let sessionUser: Awaited<ReturnType<typeof getSessionUser>> = null;
    if (!adminResult) sessionUser = await getSessionUser(req);

    if (isDev && !adminResult) {
      const cookieHeader = req.headers.get("cookie") ?? "";
      const hasSessionCookie = /(?:^|;\s*)(?:sessionId|connect\.sid)=[^;]+/.test(cookieHeader);
      console.log(
        `[GET /api/admin/newsletters] cookie present: ${hasSessionCookie ? "yes" : "no"}, isAdmin: ${adminResult}`
      );
      if (sessionUser) {
        console.log(
          `[GET /api/admin/newsletters] Session user: id=${sessionUser.id} isAdmin=${sessionUser.isAdmin} adminApproved=${sessionUser.adminApproved}`
        );
        console.log(
          `[GET /api/admin/newsletters] To fix: npx tsx scripts/create-admin.ts "<email>" <password> then log out and back in.`
        );
      } else {
        console.log(
          `[GET /api/admin/newsletters] No session user. Run: npx tsx scripts/create-session-table.ts then log out and log back in.`
        );
      }
    }

    if (!adminResult) {
      const hint = isDev
        ? sessionUser
          ? "User is not an approved admin. Run: npx tsx scripts/create-admin.ts \"<your-email>\" <password> then log out and back in."
          : "Session not found. Run: npx tsx scripts/create-session-table.ts then log out and log back in."
        : undefined;
      return NextResponse.json(
        {
          message: hint ? `Admin access required. ${hint}` : "Admin access required",
          hint,
        },
        { status: 403 }
      );
    }

    const newsletters = await storage.getAllNewsletters();
    return NextResponse.json(newsletters);
  } catch (error: unknown) {
    console.error("Error fetching newsletters:", error);
    const message = error instanceof Error ? error.message : String(error);
    const isSchemaError =
      /relation ["']?newsletters["']? does not exist/i.test(message) ||
      /relation ["']?newsletter_subscribers["']? does not exist/i.test(message) ||
      /column .* does not exist/i.test(message);
    if (isSchemaError) {
      return NextResponse.json(
        {
          error: "Failed to fetch newsletters",
          message: "Newsletter tables are missing. Run: npm run db:create",
        },
        { status: 503 }
      );
    }
    const details = process.env.NODE_ENV === "development" ? message : undefined;
    return NextResponse.json(
      { error: "Failed to fetch newsletters", ...(details && { details }) },
      { status: 500 }
    );
  }
}

// Create new newsletter
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    
    const body = await req.json();
    const newsletter = await storage.createNewsletter(body);
    return NextResponse.json(newsletter, { status: 201 });
  } catch (error: any) {
    console.error("Error creating newsletter:", error);
    return NextResponse.json({ error: "Failed to create newsletter" }, { status: 500 });
  }
}
