import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { logActivity } from "@server/services/crmFoundationService";
import { fireWorkflows, buildPayloadFromContactId } from "@server/services/workflows/engine";

export const dynamic = "force-dynamic";

/** POST /api/admin/crm/guidance/recommendation/accept — create task from AI recommendation and log. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const contactId = Number(body.contactId);
    const label = typeof body.label === "string" ? body.label.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const dealId = body.dealId != null ? Number(body.dealId) : undefined;
    const accountId = body.accountId != null ? Number(body.accountId) : undefined;

    if (!Number.isFinite(contactId) || !label) {
      return NextResponse.json({ error: "contactId and label required" }, { status: 400 });
    }
    const contact = await storage.getCrmContactById(contactId);
    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    const task = await storage.createCrmTask({
      contactId,
      relatedDealId: dealId ?? null,
      relatedAccountId: accountId ?? null,
      type: "follow_up",
      title: label,
      description: reason || undefined,
      priority: "medium",
      status: "pending",
      aiSuggested: true,
    });

    await logActivity(storage, {
      contactId,
      dealId: dealId ?? undefined,
      accountId: accountId ?? undefined,
      taskId: task.id,
      type: "ai_recommendation_accepted",
      title: "AI recommendation accepted",
      content: `${label}${reason ? ` — ${reason}` : ""}`,
      metadata: { recommendationLabel: label, taskId: task.id },
    });

    const payload = await buildPayloadFromContactId(storage, contactId).catch(() => ({ contactId, dealId, accountId }));
    fireWorkflows(storage, "recommendation_accepted", { ...payload, taskId: task.id }).catch(() => {});

    return NextResponse.json({ task: { id: task.id, title: task.title, aiSuggested: true } });
  } catch (error: unknown) {
    console.error("Recommendation accept error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
