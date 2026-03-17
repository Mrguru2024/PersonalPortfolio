import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { logActivity } from "@server/services/crmFoundationService";

export const dynamic = "force-dynamic";

/** POST /api/admin/crm/proposal-prep/[id]/create-tasks — create tasks from incomplete checklist items. */
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
    const workspace = await storage.getCrmProposalPrepWorkspaceById(id);
    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const checklist = workspace.checklist ?? [];
    const incomplete = checklist.filter((item: { id: string; label: string; done: boolean }) => !item.done);
    if (incomplete.length === 0) {
      return NextResponse.json({ created: 0, message: "No incomplete checklist items" });
    }

    const created: number[] = [];
    for (const item of incomplete) {
      const task = await storage.createCrmTask({
        contactId: workspace.contactId,
        relatedDealId: workspace.dealId ?? null,
        relatedAccountId: workspace.accountId ?? null,
        type: "proposal_prep",
        title: item.label,
        description: `From proposal prep #${id}`,
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
      title: "Tasks created from proposal prep checklist",
      content: `${created.length} task(s) from incomplete items`,
      metadata: { proposalPrepWorkspaceId: id, taskIds: created },
    });

    return NextResponse.json({ created: created.length, taskIds: created });
  } catch (error: unknown) {
    console.error("Proposal prep create-tasks error:", error);
    return NextResponse.json({ error: "Failed to create tasks" }, { status: 500 });
  }
}
