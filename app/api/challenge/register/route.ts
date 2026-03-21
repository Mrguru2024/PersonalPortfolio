/**
 * POST /api/challenge/register
 * Create challenge registration and CRM lead (or update existing contact).
 * Payment layer is stubbed; integrate Stripe when ready.
 */

import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { ensureCrmLeadFromFormSubmission } from "@server/services/leadFromFormService";
import { getLeadCustomFields } from "@shared/leadCustomFields";

export const dynamic = "force-dynamic";

const zodEmail = (v: unknown) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const fullName = String(body.fullName ?? body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const businessName = String(body.businessName ?? body.company ?? "").trim();
    const website = String(body.website ?? "").trim();
    const businessType = String(body.businessType ?? "").trim();
    const source = String(body.source ?? "challenge").trim();
    const orderBump = Boolean(body.orderBump);

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required" },
        { status: 400 }
      );
    }
    if (!zodEmail(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address" },
        { status: 400 }
      );
    }

    // Optional: real payment here (Stripe checkout session, etc.)
    // const stripePaymentId = body.stripePaymentId ?? null;
    // const amountCents = body.amountCents ?? CHALLENGE_PRICE_CENTS;

    const customFields: Record<string, unknown> = {
      challengeStatus: "joined",
      orderBumpPurchased: orderBump,
    };

    const crmLead = await ensureCrmLeadFromFormSubmission({
      email,
      name: fullName,
      company: businessName || undefined,
      attribution: {
        utm_source: "challenge",
        landing_page: "/challenge",
        referrer: body.referrer ?? undefined,
      },
      customFields,
      demographics: businessType ? { industry: businessType } : undefined,
    });

    if (!crmLead) {
      return NextResponse.json(
        { error: "Failed to create lead record" },
        { status: 500 }
      );
    }

    const existingTags = Array.isArray(crmLead.tags) ? crmLead.tags : [];
    const tags = existingTags.includes("challenge_lead")
      ? existingTags
      : [...existingTags, "challenge_lead"];
    await storage.updateCrmContact(crmLead.id, {
      source: "challenge",
      tags,
      customFields: { ...getLeadCustomFields(crmLead.customFields), ...customFields },
    });

    const existing = await storage.getChallengeRegistrationByEmail(email);
    let registration;
    if (existing) {
      registration = await storage.updateChallengeRegistration(existing.id, {
        contactId: crmLead.id,
        fullName,
        businessName: businessName || null,
        website: website || null,
        businessType: businessType || null,
        source: source || null,
        orderBumpPurchased: orderBump,
        status: "active",
      });
    } else {
      registration = await storage.createChallengeRegistration({
        contactId: crmLead.id,
        email,
        fullName,
        businessName: businessName || null,
        website: website || null,
        businessType: businessType || null,
        source: source || null,
        orderBumpPurchased: orderBump,
        amountCents: 2700,
        status: "active",
      });
    }

    return NextResponse.json({
      ok: true,
      registrationId: registration.id,
      contactId: crmLead.id,
      redirect: `/challenge/welcome?registrationId=${registration.id}`,
    });
  } catch (e) {
    console.error("Challenge register error:", e);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
