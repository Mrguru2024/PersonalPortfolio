import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const sequence = await storage.getCrmSequenceById(id);
    if (!sequence) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(sequence);
  } catch (error: any) {
    console.error("CRM sequence get error:", error);
    return NextResponse.json({ error: "Failed to load sequence" }, { status: 500 });
  }
}

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
    const sequence = await storage.updateCrmSequence(id, {
      name: body.name,
      description: body.description,
      steps: body.steps,
      isActive: body.isActive,
    });
    return NextResponse.json(sequence);
  } catch (error: any) {
    console.error("CRM sequence update error:", error);
    return NextResponse.json({ error: "Failed to update sequence" }, { status: 500 });
  }
}
