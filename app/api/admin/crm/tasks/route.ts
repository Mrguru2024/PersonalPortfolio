import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/tasks?contactId=&overdueOnly=&incompleteOnly= */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");
    const overdueOnly = searchParams.get("overdueOnly") === "true";
    const incompleteOnly = searchParams.get("incompleteOnly") !== "false";
    const tasks = await storage.getCrmTasks({
      contactId: contactId ? Number(contactId) : undefined,
      overdueOnly,
      incompleteOnly: incompleteOnly || overdueOnly,
    });
    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error("CRM tasks list error:", error);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

/** POST /api/admin/crm/tasks — create task */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const task = await storage.createCrmTask({
      contactId: body.contactId,
      type: body.type || "follow_up",
      title: body.title,
      description: body.description ?? null,
      priority: body.priority ?? "medium",
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      completedNotes: null,
      sequenceEnrollmentId: body.sequenceEnrollmentId ?? null,
    });
    return NextResponse.json(task);
  } catch (error: any) {
    console.error("CRM task create error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
