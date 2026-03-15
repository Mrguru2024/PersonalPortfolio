import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/crm/contacts/[id]/enrich
 * Apollo-style enrichment: optionally call external API (Apollo, Clearbit, etc.)
 * and update contact with linkedinUrl, company, jobTitle, etc.
 * Without APOLLO_API_KEY we mark as enriched with existing data (placeholder).
 */
export async function POST(
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

    const apiKey = process.env.APOLLO_API_KEY;
    let updates: { enrichmentStatus: string; enrichedAt: Date; linkedinUrl?: string; company?: string; jobTitle?: string; industry?: string } = {
      enrichmentStatus: "enriched",
      enrichedAt: new Date(),
    };

    if (apiKey && contact.email) {
      try {
        const res = await fetch(
          `https://api.apollo.io/api/v1/people/match?email=${encodeURIComponent(contact.email)}`,
          { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey } }
        );
        if (res.ok) {
          const data = await res.json();
          const person = data.person;
          if (person) {
            updates = {
              ...updates,
              linkedinUrl: person.linkedin_url ?? contact.linkedinUrl ?? undefined,
              company: person.organization?.name ?? contact.company ?? undefined,
              jobTitle: person.title ?? contact.jobTitle ?? undefined,
              industry: person.organization?.industry ?? contact.industry ?? undefined,
            };
          }
        } else {
          updates.enrichmentStatus = "failed";
        }
      } catch (e) {
        console.error("Apollo enrich error:", e);
        updates.enrichmentStatus = "failed";
      }
    }
    // If no API key, we still mark as "enriched" so UI can show enrichment ran (placeholder).

    await storage.updateCrmContact(id, updates);
    const updated = await storage.getCrmContactById(id);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("CRM enrich error:", error);
    return NextResponse.json({ error: "Failed to enrich contact" }, { status: 500 });
  }
}
