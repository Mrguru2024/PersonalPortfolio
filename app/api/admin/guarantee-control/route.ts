import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  guaranteeActionTypeSchema,
  guaranteeControlFilterSchema,
} from "@shared/guaranteeEngine";
import { listGuaranteeControlRows } from "@server/services/guaranteeEngineService";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const parsedFilter = guaranteeControlFilterSchema.safeParse(
      searchParams.get("filter") ?? "all",
    );
    const filter = parsedFilter.success ? parsedFilter.data : "all";

    const rows = await listGuaranteeControlRows(filter);
    return NextResponse.json({ rows, filter });
  } catch (error) {
    console.error("[admin/guarantee-control] GET failed:", error);
    return NextResponse.json(
      { message: "Failed to load guarantee control panel" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const clientId = Number(body.clientId);
    if (!Number.isFinite(clientId) || clientId <= 0) {
      return NextResponse.json({ message: "Valid clientId is required" }, { status: 400 });
    }

    const parsedAction = guaranteeActionTypeSchema.safeParse(body.action);
    if (!parsedAction.success) {
      return NextResponse.json({ message: "Valid action is required" }, { status: 400 });
    }

    const action = parsedAction.data;
    const titleByAction = {
      optimize_funnel: "Optimize Funnel",
      adjust_offer: "Adjust Offer",
      increase_traffic: "Increase Traffic",
      fix_conversion_flow: "Fix Conversion Flow",
    } as const;

    const task = await storage.createCrmTask({
      contactId: clientId,
      type: "follow_up",
      title: `Guarantee action: ${titleByAction[action]}`,
      description: `Triggered from Guarantee Control Panel. Action: ${titleByAction[action]}.`,
      priority: "high",
      status: "pending",
      dueAt: null,
      completedAt: null,
      completedNotes: null,
      sequenceEnrollmentId: null,
      relatedAccountId: null,
      relatedDealId: null,
      assignedToUserId: null,
      taskType: "follow_up",
      aiSuggested: true,
      ownerId: null,
    });

    return NextResponse.json({ ok: true, action, taskId: task.id });
  } catch (error) {
    console.error("[admin/guarantee-control] POST failed:", error);
    return NextResponse.json(
      { message: "Failed to trigger guarantee action" },
      { status: 500 },
    );
  }
}
