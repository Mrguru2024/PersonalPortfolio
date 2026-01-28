import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { getSessionUser } from "@/lib/auth-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const admin = await getSessionUser(req);

    const feedback = await storage.updateClientFeedback(parseInt(id), {
      ...body,
      respondedBy: admin?.id,
      respondedAt: body.adminResponse ? new Date() : undefined,
    });

    return NextResponse.json(feedback);
  } catch (error: any) {
    console.error("Error updating feedback:", error);
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}
