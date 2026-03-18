/**
 * POST /api/challenge/apply — submit challenge qualification form.
 * Updates CRM contact customFields and marks qualificationSubmitted / readyForCall.
 */

import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { getLeadCustomFields } from "@shared/leadCustomFields";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const registrationId = body.registrationId != null ? Number(body.registrationId) : NaN;
    if (!registrationId || Number.isNaN(registrationId)) {
      return NextResponse.json({ error: "registrationId required" }, { status: 400 });
    }

    const reg = await storage.getChallengeRegistrationById(registrationId);
    if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    const contactId = reg.contactId;
    if (!contactId) return NextResponse.json({ error: "Contact not linked" }, { status: 400 });

    const contact = await storage.getCrmContactById(contactId);
    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    const existingCustom = getLeadCustomFields(contact.customFields);
    const qualification = {
      mainGoal: String(body.mainGoal ?? "").trim(),
      websiteStatus: String(body.websiteStatus ?? "").trim(),
      leadGenProblem: String(body.leadGenProblem ?? "").trim(),
      budgetRange: String(body.budgetRange ?? "").trim(),
      timeline: String(body.timeline ?? "").trim(),
      implementationInterest: String(body.implementationInterest ?? "").trim(),
      notes: String(body.notes ?? "").trim(),
    };

    const customFields = {
      ...existingCustom,
      ...qualification,
      qualificationSubmitted: true,
      readyForCall: ["yes_soon", "yes_later", "maybe"].includes(qualification.implementationInterest),
    };

    await storage.updateCrmContact(contactId, { customFields });
    await storage.updateChallengeRegistration(registrationId, { status: "completed" });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Challenge apply error:", e);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
