import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const body = await req.json();
    const profile = await storage.updateCrmResearchProfile(id, body);
    return NextResponse.json(profile);
  } catch (error: unknown) {
    console.error("Error updating research profile:", error);
    return NextResponse.json({ error: "Failed to update research profile" }, { status: 500 });
  }
}
