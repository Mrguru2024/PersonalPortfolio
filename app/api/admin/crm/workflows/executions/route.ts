import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/workflows/executions?entityType=contact&entityId=123 — list workflow executions for an entity. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType") ?? "contact";
    const entityId = Number(searchParams.get("entityId"));
    const limit = Number(searchParams.get("limit")) || 20;

    if (!Number.isFinite(entityId)) {
      return NextResponse.json({ error: "entityId required" }, { status: 400 });
    }
    if (!["contact", "account", "deal", "appointment"].includes(entityType)) {
      return NextResponse.json(
        { error: "entityType must be contact, account, deal, or appointment" },
        { status: 400 },
      );
    }

    const executions = await storage.getCrmWorkflowExecutionsByEntity(entityType, entityId, limit);
    return NextResponse.json(
      executions.map((e) => ({
        id: e.id,
        workflowKey: e.workflowKey,
        triggerType: e.triggerType,
        status: e.status,
        executedActions: e.executedActions ?? [],
        startedAt: e.startedAt?.toISOString(),
        finishedAt: e.finishedAt?.toISOString(),
        errorMessage: e.errorMessage,
      }))
    );
  } catch (error: unknown) {
    console.error("Workflow executions GET error:", error);
    return NextResponse.json({ error: "Failed to load executions" }, { status: 500 });
  }
}
