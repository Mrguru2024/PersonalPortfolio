import { NextRequest, NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { crmContacts } from "@shared/crmSchema";
import { db } from "@server/db";
import { storage } from "@server/storage";
import { logActivity } from "@server/services/crmFoundationService";
import { fireWorkflows, buildPayloadFromContactId } from "@server/services/workflows/engine";
import { onNewCrmContactCreated } from "@server/services/revenueOpsService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as "lead" | "client" | null;
    const accountId = searchParams.get("accountId");
    const q = searchParams.get("q")?.trim() ?? "";
    const idsParam = searchParams.get("ids")?.trim() ?? "";

    if (q.length > 0) {
      const limitRaw = Number(searchParams.get("limit") ?? "40");
      const limit = Number.isFinite(limitRaw) ? limitRaw : 40;
      const contacts = await storage.searchCrmContactsForAdminPicker(q, limit);
      return NextResponse.json(contacts);
    }

    if (idsParam.length > 0) {
      const ids = [
        ...new Set(
          idsParam
            .split(/[\s,]+/)
            .map((x) => Number.parseInt(x.trim(), 10))
            .filter((n) => Number.isFinite(n) && n > 0)
        ),
      ];
      if (ids.length === 0) return NextResponse.json([]);
      const rows = await db.select().from(crmContacts).where(inArray(crmContacts.id, ids));
      const contacts = await storage.enrichCrmContactsForAdminList(rows);
      const byId = new Map(contacts.map((c) => [c.id, c]));
      const ordered = ids.map((id) => byId.get(id)).filter((c): c is NonNullable<typeof c> => !!c);
      return NextResponse.json(ordered);
    }

    if (accountId != null && accountId !== "") {
      const raw = await storage.getCrmContactsByAccountId(Number(accountId));
      const contacts = await storage.enrichCrmContactsForAdminList(raw);
      return NextResponse.json(contacts);
    }
    const contacts = await storage.getCrmContactsForAdminList(type ?? undefined);
    return NextResponse.json(contacts);
  } catch (error: any) {
    const msg = error?.message ?? String(error);
    const missingTable = /crm_contacts.*does not exist|relation.*crm_contacts|table.*crm_contacts/i.test(msg);
    if (missingTable) {
      console.warn("CRM contacts table missing. Run scripts/create-tables.sql (CRM section) or migrate DB.");
      return NextResponse.json([]);
    }
    console.error("Error fetching CRM contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch CRM contacts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const user = await getSessionUser(req);
    const contact = await storage.createCrmContact({
      type: body.type || "lead",
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      company: body.company ?? null,
      jobTitle: body.jobTitle ?? null,
      industry: body.industry ?? null,
      location: body.location ?? null,
      createdByUserId: user?.id ?? null,
      accountId: body.accountId ?? null,
      firstName: body.firstName ?? null,
      lastName: body.lastName ?? null,
      notesSummary: body.notesSummary ?? null,
      ownerUserId: body.ownerUserId ?? null,
      source: body.source ?? null,
      status: body.status ?? "new",
      estimatedValue: body.estimatedValue ?? null,
      notes: body.notes ?? null,
      tags: body.tags ?? null,
      customFields: body.customFields ?? null,
      contactId: body.contactId ?? null,
      stripeCustomerId: body.stripeCustomerId ?? null,
    });
    logActivity(storage, {
      contactId: contact.id,
      accountId: contact.accountId ?? undefined,
      type: "contact_created",
      title: "Contact created",
      content: contact.name,
      createdByUserId: user?.id,
    }).catch(() => {});
    const payload = await buildPayloadFromContactId(storage, contact.id).catch(() => ({ contactId: contact.id, contact }));
    fireWorkflows(storage, "contact_created", payload).catch(() => {});
    onNewCrmContactCreated(storage, contact).catch(() => {});
    return NextResponse.json(contact);
  } catch (error: any) {
    console.error("Error creating CRM contact:", error);
    return NextResponse.json(
      { error: "Failed to create CRM contact" },
      { status: 500 }
    );
  }
}
