import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { getPersistedGuidance, generateAndPersistAccountGuidance } from "@server/services/crmAiGuidanceService";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/guidance/account/[id] — get persisted AI guidance for account. */
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
    const account = await storage.getCrmAccountById(id);
    if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const guidance = await getPersistedGuidance(storage, "account", id);
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
    console.error("Guidance account GET error:", error);
    return NextResponse.json({ error: "Failed to load guidance" }, { status: 500 });
  }
}

/** POST /api/admin/crm/guidance/account/[id] — generate and persist AI guidance for account. */
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
    const account = await storage.getCrmAccountById(id);
    if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const results = await generateAndPersistAccountGuidance({ accountId: id, storage });
    const byType: Record<string, { id: number; providerType: string }> = {};
    for (const [outputType, v] of Object.entries(results)) {
      byType[outputType] = { id: v.id, providerType: v.providerType };
    }
    return NextResponse.json({ generated: byType });
  } catch (error: unknown) {
    console.error("Guidance account POST error:", error);
    return NextResponse.json({ error: "Failed to generate guidance" }, { status: 500 });
  }
}
