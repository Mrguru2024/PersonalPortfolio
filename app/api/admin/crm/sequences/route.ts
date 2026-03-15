import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/sequences */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const sequences = await storage.getCrmSequences();
    return NextResponse.json(sequences);
  } catch (error: any) {
    console.error("CRM sequences list error:", error);
    return NextResponse.json({ error: "Failed to load sequences" }, { status: 500 });
  }
}

/** POST /api/admin/crm/sequences — create sequence */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const sequence = await storage.createCrmSequence({
      name: body.name,
      description: body.description ?? null,
      steps: Array.isArray(body.steps) ? body.steps : [],
      isActive: body.isActive !== false,
    });
    return NextResponse.json(sequence);
  } catch (error: any) {
    console.error("CRM sequence create error:", error);
    return NextResponse.json({ error: "Failed to create sequence" }, { status: 500 });
  }
}
