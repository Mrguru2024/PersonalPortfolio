import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { suggestNextStepsForReminder } from "@server/services/reminderAIService";

export const dynamic = "force-dynamic";

/** POST /api/admin/reminders/[id]/suggest-next — AI-suggest next steps for this reminder. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { id } = await params;
    const reminderId = parseInt(id, 10);
    if (Number.isNaN(reminderId)) {
      return NextResponse.json({ error: "Invalid reminder id" }, { status: 400 });
    }

    const reminder = await storage.getAdminReminderById(reminderId);
    if (!reminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    const result = await suggestNextStepsForReminder({
      title: reminder.title,
      body: reminder.body,
      relatedType: reminder.relatedType,
      actionUrl: reminder.actionUrl,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("POST suggest-next error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to suggest next steps" },
      { status: 500 }
    );
  }
}
