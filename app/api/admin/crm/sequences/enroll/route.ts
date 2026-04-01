import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { logActivity } from "@server/services/crmFoundationService";
import { fireWorkflows, buildPayloadFromContactId } from "@server/services/workflows/engine";
import { onNewCrmContactCreated } from "@server/services/revenueOpsService";

export const dynamic = "force-dynamic";

/** POST /api/admin/crm/sequences/enroll — enroll contact(s) in a sequence */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const sequenceId = Number(body.sequenceId);
    if (!Number.isFinite(sequenceId)) {
      return NextResponse.json({ error: "sequenceId required" }, { status: 400 });
    }

    const sequence = await storage.getCrmSequenceById(sequenceId);
    if (!sequence) return NextResponse.json({ error: "Sequence not found" }, { status: 404 });

    const user = await getSessionUser(req);
    const ids = new Set<number>();

    const pushId = (n: unknown) => {
      const v = Number(n);
      if (Number.isFinite(v) && v > 0) ids.add(v);
    };

    if (body.contactId != null) pushId(body.contactId);
    if (Array.isArray(body.contactIds)) for (const x of body.contactIds) pushId(x);

    if (body.enrollAllLeads === true) {
      const leads = await storage.getCrmContacts("lead");
      for (const c of leads) pushId(c.id);
    }
    if (body.enrollAllContacts === true) {
      const all = await storage.getCrmContacts();
      for (const c of all) pushId(c.id);
    }

    if (body.newContact && typeof body.newContact === "object") {
      const nc = body.newContact as Record<string, unknown>;
      const name = typeof nc.name === "string" ? nc.name.trim() : "";
      const email = typeof nc.email === "string" ? nc.email.trim() : "";
      if (!name || !email) {
        return NextResponse.json({ error: "newContact requires name and email" }, { status: 400 });
      }
      const contact = await storage.createCrmContact({
        type: typeof nc.type === "string" ? nc.type : "lead",
        name,
        email,
        phone: typeof nc.phone === "string" ? nc.phone : null,
        company: typeof nc.company === "string" ? nc.company : null,
        jobTitle: typeof nc.jobTitle === "string" ? nc.jobTitle : null,
        industry: typeof nc.industry === "string" ? nc.industry : null,
        accountId: null,
        firstName: typeof nc.firstName === "string" ? nc.firstName : null,
        lastName: typeof nc.lastName === "string" ? nc.lastName : null,
        notesSummary: null,
        ownerUserId: null,
        source: typeof nc.source === "string" ? nc.source : "sequence_enroll",
        status: "new",
        estimatedValue: null,
        notes: typeof nc.notes === "string" ? nc.notes : null,
        tags: Array.isArray(nc.tags) ? (nc.tags as string[]) : null,
        customFields:
          typeof nc.customFields === "object" && nc.customFields !== null
            ? (nc.customFields as Record<string, unknown>)
            : null,
        contactId: null,
        stripeCustomerId: null,
      });
      logActivity(storage, {
        contactId: contact.id,
        accountId: contact.accountId ?? undefined,
        type: "contact_created",
        title: "Contact created from sequence enroll",
        content: contact.name,
        createdByUserId: user?.id,
      }).catch(() => {});
      const payload = await buildPayloadFromContactId(storage, contact.id).catch(() => ({ contactId: contact.id, contact }));
      fireWorkflows(storage, "contact_created", payload).catch(() => {});
      onNewCrmContactCreated(storage, contact).catch(() => {});
      pushId(contact.id);
    }

    if (ids.size === 0) {
      return NextResponse.json(
        { error: "Provide contactId, contactIds, enrollAllLeads, enrollAllContacts, or newContact" },
        { status: 400 },
      );
    }

    const existing = await storage.getCrmSequenceEnrollments(undefined, sequenceId);
    const activeForContact = new Set(
      existing.filter((e) => e.status === "active").map((e) => e.contactId),
    );

    const created = [];
    let skipped = 0;
    for (const cid of ids) {
      if (activeForContact.has(cid)) {
        skipped++;
        continue;
      }
      const enrollment = await storage.createCrmSequenceEnrollment({
        contactId: cid,
        sequenceId,
        currentStepIndex: 0,
        status: "active",
        lastStepAt: new Date(),
      });
      created.push(enrollment);
      activeForContact.add(cid);
    }

    return NextResponse.json({ enrollments: created, skipped, totalRequested: ids.size });
  } catch (error: any) {
    console.error("CRM sequence enroll error:", error);
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
  }
}
