import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/crm/sequences/run-step
 * Process next step for an enrollment: create task or log "email to send", advance step.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const enrollmentId = body.enrollmentId ?? body.enrollment_id;
    if (!enrollmentId) {
      return NextResponse.json({ error: "enrollmentId required" }, { status: 400 });
    }

    const enrollments = await storage.getCrmSequenceEnrollments(undefined, undefined);
    const enrollment = enrollments.find((e) => e.id === Number(enrollmentId));
    if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    if (enrollment.status !== "active") {
      return NextResponse.json({ error: "Enrollment is not active" }, { status: 400 });
    }

    const sequence = enrollment.sequence ?? (await storage.getCrmSequenceById(enrollment.sequenceId));
    if (!sequence || !sequence.steps || sequence.steps.length === 0) {
      return NextResponse.json({ error: "Sequence not found or has no steps" }, { status: 404 });
    }

    const stepIndex = enrollment.currentStepIndex;
    const step = sequence.steps[stepIndex];
    if (!step) {
      await storage.updateCrmSequenceEnrollment(enrollment.id, { status: "completed", completedAt: new Date() });
      return NextResponse.json({ done: true, message: "Sequence completed" });
    }

    const now = new Date();
    if (step.type === "task" && (step.taskTitle || step.taskType)) {
      const dueAt = new Date(now);
      dueAt.setDate(dueAt.getDate() + (step.waitDays ?? 0));
      await storage.createCrmTask({
        contactId: enrollment.contactId,
        type: (step.taskType as any) || "follow_up",
        title: step.taskTitle || `Sequence: ${sequence.name} step ${stepIndex + 1}`,
        description: null,
        priority: "medium",
        dueAt,
        sequenceEnrollmentId: enrollment.id,
      });
    }
    if (step.type === "email" && (step.subject || step.body)) {
      await storage.createCrmActivity({
        contactId: enrollment.contactId,
        dealId: null,
        type: "email",
        subject: step.subject || `Sequence: ${sequence.name} step ${stepIndex + 1}`,
        body: step.body ?? null,
      });
    }

    const nextIndex = stepIndex + 1;
    const isComplete = nextIndex >= sequence.steps.length;
    await storage.updateCrmSequenceEnrollment(enrollment.id, {
      currentStepIndex: nextIndex,
      lastStepAt: now,
      status: isComplete ? "completed" : "active",
      completedAt: isComplete ? now : undefined,
    });

    return NextResponse.json({
      stepIndex: nextIndex,
      completed: isComplete,
      nextStep: sequence.steps[nextIndex] ?? null,
    });
  } catch (error: any) {
    console.error("CRM sequence run-step error:", error);
    return NextResponse.json({ error: "Failed to run step" }, { status: 500 });
  }
}
