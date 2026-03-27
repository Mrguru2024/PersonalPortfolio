import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
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
    const idsRaw = searchParams.get("ids");
    if (idsRaw != null && idsRaw.trim() !== "") {
      const ids = idsRaw
        .split(",")
        .map((x) => Number(x.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
      if (ids.length > 0) {
        const contacts = await storage.getCrmContactsByIds(ids);
        return NextResponse.json(contacts);
      }
    }
    const search = searchParams.get("search")?.trim();
    if (search && search.length >= 2) {
      const contacts = await storage.searchCrmContacts(search);
      return NextResponse.json(contacts);
    }
    const type = searchParams.get("type") as "lead" | "client" | null;
    const accountId = searchParams.get("accountId");
    if (accountId != null && accountId !== "") {
      const contacts = await storage.getCrmContactsByAccountId(Number(accountId));
      return NextResponse.json(contacts);
    }
    const contacts = await storage.getCrmContacts(type ?? undefined);
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
    const contact = await storage.createCrmContact({
      type: body.type || "lead",
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      company: body.company ?? null,
      jobTitle: body.jobTitle ?? null,
      industry: body.industry ?? null,
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
    const user = await getSessionUser(req);
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
