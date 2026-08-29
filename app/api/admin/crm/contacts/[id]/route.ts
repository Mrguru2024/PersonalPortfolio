import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { getAfnCommunitySnapshotByEmail } from "@server/afnStorage";
import { insertCrmContactSchema, type InsertCrmContact, type CrmContact } from "@shared/crmSchema";
import {
  getLatestAeeAttributionForContact,
  recordAeeCrmAttributionEvent,
} from "@server/services/experimentation/aeeCrmAttributionService";

const crmContactPatchSchema = insertCrmContactSchema.partial();

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const contact = await storage.getCrmContactById(id);
    if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const afnCommunity = await getAfnCommunitySnapshotByEmail(contact.email);
    const normalized = normalizeCrmContact(contact);
    return NextResponse.json({ ...normalized, afnCommunity });
  } catch (error: any) {
    console.error("Error fetching CRM contact:", error);
    return NextResponse.json({ error: "Failed to fetch CRM contact" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const body = await req.json();
    const parsed = crmContactPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid contact fields", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const updates = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v !== undefined),
    ) as Partial<InsertCrmContact>;
    const existing = await storage.getCrmContactById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existing);
    }
    const contact = await storage.updateCrmContact(id, updates);
    const bookedBecameSet = updates.bookedCallAt != null && existing.bookedCallAt == null;
    if (bookedBecameSet) {
      const aee = await getLatestAeeAttributionForContact(id).catch(() => null);
      if (aee) {
        await recordAeeCrmAttributionEvent({
          contactId: id,
          experimentId: aee.experimentId,
          variantId: aee.variantId,
          eventKind: "booked_call",
          metadataJson: { source: "crm_contact_patch" },
        }).catch(() => {});
      }
    }
    const normalized = normalizeCrmContact(contact);
    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error("Error updating CRM contact:", error);
    return NextResponse.json({ error: "Failed to update CRM contact" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    await storage.deleteCrmContact(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting CRM contact:", error);
    return NextResponse.json({ error: "Failed to delete CRM contact" }, { status: 500 });
  }
}
