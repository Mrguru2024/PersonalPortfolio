import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { SCHEDULER_WORKFLOW_TRIGGER_TYPES } from "@server/services/schedulingWorkflowHooks";

export const dynamic = "force-dynamic";

/** Recent CRM workflow runs triggered by scheduler lifecycle (booked, cancelled, completed, no-show). */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 15;

    const rows = await storage.getRecentCrmWorkflowExecutionsByTriggers(SCHEDULER_WORKFLOW_TRIGGER_TYPES, limit);
    return NextResponse.json({
      executions: rows.map((e) => ({
        id: e.id,
        workflowKey: e.workflowKey,
        triggerType: e.triggerType,
        relatedEntityType: e.relatedEntityType,
        relatedEntityId: e.relatedEntityId,
        status: e.status,
        executedActions: e.executedActions ?? [],
        startedAt: e.startedAt?.toISOString(),
        finishedAt: e.finishedAt?.toISOString(),
        errorMessage: e.errorMessage,
        metadata: e.metadata ?? null,
      })),
    });
  } catch (error: unknown) {
    console.error("scheduler workflow-activity GET error:", error);
    return NextResponse.json({ error: "Failed to load workflow activity" }, { status: 500 });
  }
}
