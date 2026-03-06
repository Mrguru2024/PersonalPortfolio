import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { message: "Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = Number.parseInt(id, 10);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ message: "Invalid user id." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const approved = body?.approved === true;

    const existing = await storage.getUser(userId);
    if (!existing) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const updated = await storage.updateUser(userId, {
      role: approved ? "developer" : "user",
      adminApproved: approved,
      isAdmin: false,
    });

    const { password, ...safeUser } = updated;
    return NextResponse.json({
      message: approved
        ? "Developer contributor approved."
        : "Developer contributor request rejected.",
      user: safeUser,
    });
  } catch (error) {
    console.error("Error in PATCH /api/admin/users/[id]/developer-approval:", error);
    return NextResponse.json(
      { message: "Failed to update developer approval." },
      { status: 500 }
    );
  }
}
