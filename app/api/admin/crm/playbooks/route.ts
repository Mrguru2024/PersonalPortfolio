import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/playbooks?activeOnly=true — list sales playbooks. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") !== "false";
    const list = await storage.getCrmSalesPlaybooks(activeOnly);
    return NextResponse.json({ playbooks: list });
  } catch (error: unknown) {
    console.error("Playbooks GET error:", error);
    return NextResponse.json({ error: "Failed to load playbooks" }, { status: 500 });
  }
}

/** POST /api/admin/crm/playbooks — create a sales playbook. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    const slug =
      typeof body.slug === "string" && body.slug.trim()
        ? body.slug.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
        : title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const playbook = await storage.createCrmSalesPlaybook({
      title,
      slug,
      category: body.category ?? null,
      serviceType: body.serviceType ?? null,
      description: body.description ?? null,
      checklistItems: Array.isArray(body.checklistItems) ? body.checklistItems : null,
      qualificationRules: body.qualificationRules ?? null,
      redFlags: body.redFlags ?? null,
      proposalRequirements: body.proposalRequirements ?? null,
      followUpGuidance: body.followUpGuidance ?? null,
      active: body.active !== false,
    });
    return NextResponse.json(playbook);
  } catch (error: unknown) {
    console.error("Playbooks POST error:", error);
    return NextResponse.json({ error: "Failed to create playbook" }, { status: 500 });
  }
}
