import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { logActivity } from "@server/services/crmFoundationService";

export const dynamic = "force-dynamic";

/** POST /api/admin/crm/discovery/[id]/create-follow-up-tasks — create tasks from discovery outcome follow-up items. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const workspace = await storage.getCrmDiscoveryWorkspaceById(id);
    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const outcome = workspace.outcome as { followUpItems?: string[] } | null;
    const items = outcome?.followUpItems ?? [];
    if (items.length === 0) {
      return NextResponse.json({ created: 0, message: "No follow-up items in outcome" });
    }

    const created: number[] = [];
    for (const label of items) {
      if (!String(label).trim()) continue;
      const task = await storage.createCrmTask({
        contactId: workspace.contactId,
        relatedDealId: workspace.dealId ?? null,
        relatedAccountId: workspace.accountId ?? null,
        type: "follow_up",
        title: String(label).trim(),
        description: `From discovery workspace #${id}`,
        priority: "medium",
        dueAt: null,
        completedNotes: null,
        sequenceEnrollmentId: null,
      });
      created.push(task.id);
    }

    await logActivity(storage, {
      contactId: workspace.contactId,
      accountId: workspace.accountId ?? undefined,
      dealId: workspace.dealId ?? undefined,
      type: "task_created",
      title: "Tasks created from discovery follow-up items",
      content: `${created.length} task(s)`,
      metadata: { discoveryWorkspaceId: id, taskIds: created },
    });

    return NextResponse.json({ created: created.length, taskIds: created });
  } catch (error: unknown) {
    console.error("Discovery create-follow-up-tasks error:", error);
    return NextResponse.json({ error: "Failed to create tasks" }, { status: 500 });
  }
}
