import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

const ALLOWED_KEYS = [
  "blog",
  "pages",
  "announcements",
  "newsletters",
  "funnel",
  "invoices",
  "feedback",
  "crm",
  "dashboard",
] as const;

function isValidPermissions(
  body: unknown
): body is Record<string, boolean> {
  if (!body || typeof body !== "object") return false;
  for (const key of Object.keys(body)) {
    if (!ALLOWED_KEYS.includes(key as (typeof ALLOWED_KEYS)[number]))
      return false;
    if (typeof (body as Record<string, unknown>)[key] !== "boolean")
      return false;
  }
  return true;
}

/**
 * PATCH /api/admin/users/[id]/permissions
 * Set privileges for a user (super user only).
 * Body: { permissions: { blog: true, pages: false, ... } }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isSuperUser(req))) {
      return NextResponse.json(
        { message: "Super user access required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (Number.isNaN(userId)) {
      return NextResponse.json(
        { message: "Invalid user id" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const permissions = body?.permissions;
    if (!isValidPermissions(permissions)) {
      return NextResponse.json(
        { message: "Valid permissions object required" },
        { status: 400 }
      );
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Only super user can change permissions; do not allow changing a developer's permissions
    if (user.role === "developer") {
      return NextResponse.json(
        { message: "Cannot change developer permissions" },
        { status: 400 }
      );
    }

    const updated = await storage.updateUser(userId, { permissions });
    const { password: _, ...out } = updated;
    return NextResponse.json(out);
  } catch (e) {
    console.error("Error updating user permissions:", e);
    return NextResponse.json(
      { message: "Error updating permissions" },
      { status: 500 }
    );
  }
}
