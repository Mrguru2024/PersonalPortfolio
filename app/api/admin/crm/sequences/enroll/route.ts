import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** POST /api/admin/crm/sequences/enroll — enroll contact(s) in a sequence */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const { contactId, contactIds, sequenceId } = body;
    const ids: number[] = contactId != null ? [Number(contactId)] : Array.isArray(contactIds) ? contactIds.map(Number) : [];
    if (ids.length === 0 || !sequenceId) {
      return NextResponse.json({ error: "contactId or contactIds and sequenceId required" }, { status: 400 });
    }
    const sequence = await storage.getCrmSequenceById(Number(sequenceId));
    if (!sequence) return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
    const created = [];
    for (const cid of ids) {
      const enrollment = await storage.createCrmSequenceEnrollment({
        contactId: cid,
        sequenceId: Number(sequenceId),
        currentStepIndex: 0,
        status: "active",
        lastStepAt: new Date(),
      });
      created.push(enrollment);
    }
    return NextResponse.json({ enrollments: created });
  } catch (error: any) {
    console.error("CRM sequence enroll error:", error);
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
  }
}
