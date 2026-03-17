import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { getPersistedGuidance, generateAndPersistLeadGuidance } from "@server/services/crmAiGuidanceService";
import { fireWorkflows, buildPayloadFromContactId } from "@server/services/workflows/engine";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/guidance/contact/[id] — get persisted AI guidance for contact (lead). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const contact = await storage.getCrmContactById(id);
    if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const guidance = await getPersistedGuidance(storage, "contact", id);
    const byType: Record<string, { content: Record<string, unknown>; providerType: string; generatedAt: string }> = {};
    for (const g of guidance) {
      byType[g.outputType] = {
        content: g.content,
        providerType: g.providerType,
        generatedAt: g.generatedAt.toISOString(),
      };
    }
    return NextResponse.json({ guidance: byType });
  } catch (error: unknown) {
    console.error("Guidance contact GET error:", error);
    return NextResponse.json({ error: "Failed to load guidance" }, { status: 500 });
  }
}

/** POST /api/admin/crm/guidance/contact/[id] — generate and persist AI guidance for contact. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const contact = await storage.getCrmContactById(id);
    if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const results = await generateAndPersistLeadGuidance({ contactId: id, storage });
    const payload = await buildPayloadFromContactId(storage, id).catch(() => ({ contactId: id, contact }));
    fireWorkflows(storage, "ai_summary_generated", payload).catch(() => {});
    const byType: Record<string, { id: number; providerType: string }> = {};
    for (const [outputType, v] of Object.entries(results)) {
      byType[outputType] = { id: v.id, providerType: v.providerType };
    }
    return NextResponse.json({ generated: byType });
  } catch (error: unknown) {
    console.error("Guidance contact POST error:", error);
    return NextResponse.json({ error: "Failed to generate guidance" }, { status: 500 });
  }
}
