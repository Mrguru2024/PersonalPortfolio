import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { logActivity } from "@server/services/crmFoundationService";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/activity-log?contactId=|accountId=|dealId= — list activity. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");
    const accountId = searchParams.get("accountId");
    const dealId = searchParams.get("dealId");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    if (contactId != null) {
      const list = await storage.getCrmActivityLogByContactId(Number(contactId), limit);
      return NextResponse.json(list);
    }
    if (accountId != null) {
      const list = await storage.getCrmActivityLogByAccountId(Number(accountId), limit);
      return NextResponse.json(list);
    }
    if (dealId != null) {
      const list = await storage.getCrmActivityLogByDealId(Number(dealId), limit);
      return NextResponse.json(list);
    }
    return NextResponse.json([]);
  } catch (error: unknown) {
    console.error("Error fetching activity log:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}

/** POST /api/admin/crm/activity-log — create a unified activity log entry. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const user = await (await import("@/lib/auth-helpers")).getSessionUser(req);
    const userId = user?.id ?? null;
    await logActivity(storage, {
      contactId: body.contactId ?? undefined,
      accountId: body.accountId ?? undefined,
      dealId: body.dealId ?? undefined,
      taskId: body.taskId ?? undefined,
      type: body.type ?? "note",
      title: body.title ?? "Activity",
      content: body.content ?? undefined,
      metadata: body.metadata ?? undefined,
      createdByUserId: userId ?? undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Error creating activity log:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}
