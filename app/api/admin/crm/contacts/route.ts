import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { logActivity } from "@server/services/crmFoundationService";
import { fireWorkflows, buildPayloadFromContactId } from "@server/services/workflows/engine";
import { onNewCrmContactCreated } from "@server/services/revenueOpsService";
import type { CrmContact } from "@shared/crmSchema";

export const dynamic = "force-dynamic";

/**
 * Normalize CRM contact to ensure all array fields are initialized.
 * Prevents "X is not a function" errors when UI tries to map over null/undefined arrays.
 */
function normalizeCrmContact(contact: CrmContact): CrmContact {
  return {
    ...contact,
    tags: Array.isArray(contact.tags) ? contact.tags : [],
    customFields: contact.customFields && typeof contact.customFields === "object" ? 
      normalizeCustomFields(contact.customFields as Record<string, unknown>) : 
      {},
  };
}

/**
 * Recursively normalize customFields to ensure nested arrays are initialized.
 */
function normalizeCustomFields(fields: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) {
      // Check if the key suggests it should be an array
      if (key.endsWith('s') || key.includes('list') || key.includes('items') || key.includes('data') || key.includes('attachments')) {
        normalized[key] = [];
      } else {
        normalized[key] = value;
      }
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      normalized[key] = normalizeCustomFields(value as Record<string, unknown>);
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

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
        const normalized = contacts.map(normalizeCrmContact);
        return NextResponse.json(normalized);
      }
    }
    const search = searchParams.get("search")?.trim();
    if (search && search.length >= 2) {
      const contacts = await storage.searchCrmContacts(search);
      const normalized = contacts.map(normalizeCrmContact);
      return NextResponse.json(normalized);
    }
    const type = searchParams.get("type") as "lead" | "client" | null;
    const accountId = searchParams.get("accountId");
    if (accountId != null && accountId !== "") {
      const contacts = await storage.getCrmContactsByAccountId(Number(accountId));
      const normalized = contacts.map(normalizeCrmContact);
      return NextResponse.json(normalized);
    }
    const limitRaw = searchParams.get("limit");
    const limit =
      limitRaw != null && limitRaw !== "" && Number.isFinite(Number(limitRaw)) ?
        Math.min(Math.max(Number(limitRaw), 1), 200)
      : undefined;
    const contacts = await storage.getCrmContacts(type ?? undefined, limit);
    const normalized = contacts.map(normalizeCrmContact);
    return NextResponse.json(normalized);
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
    const normalized = normalizeCrmContact(contact);
    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error("Error creating CRM contact:", error);
    return NextResponse.json(
      { error: "Failed to create CRM contact" },
      { status: 500 }
    );
  }
}
