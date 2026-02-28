import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as "lead" | "client" | null;
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
      source: body.source ?? null,
      status: body.status ?? "new",
      estimatedValue: body.estimatedValue ?? null,
      notes: body.notes ?? null,
      tags: body.tags ?? null,
      customFields: body.customFields ?? null,
      contactId: body.contactId ?? null,
      stripeCustomerId: body.stripeCustomerId ?? null,
    });
    return NextResponse.json(contact);
  } catch (error: any) {
    console.error("Error creating CRM contact:", error);
    return NextResponse.json(
      { error: "Failed to create CRM contact" },
      { status: 500 }
    );
  }
}
