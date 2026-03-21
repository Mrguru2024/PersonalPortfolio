import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@server/storage";
import { ensureCrmLeadFromFormSubmission } from "@server/services/leadFromFormService";
import { emailService } from "@server/services/emailService";
import type { InsertContact } from "@shared/schema";

const bodySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  company: z.string().trim().optional(),
  websiteUrl: z.string().trim().optional(),
  businessType: z.string().trim().optional(),
  primaryGoal: z.string().trim().min(1, "Select a primary goal"),
  timeline: z.string().trim().min(1, "Select a timeline"),
  toolsFocus: z.string().trim().max(2000).optional(),
  visitorId: z.string().trim().optional().nullable(),
  utm_source: z.string().trim().optional().nullable(),
  utm_medium: z.string().trim().optional().nullable(),
  utm_campaign: z.string().trim().optional().nullable(),
  referrer: z.string().trim().optional().nullable(),
  landing_page: z.string().trim().optional().nullable(),
});

const SUBJECT = "Free growth tools — qualified lead";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const message = Object.values(first).flat()[0] ?? "Invalid submission";
      return NextResponse.json({ message, fieldErrors: first }, { status: 400 });
    }

    const b = parsed.data;
    const message = [
      "Source: Free growth tools hub (qualified lead gate)",
      `Primary goal: ${b.primaryGoal}`,
      `Timeline: ${b.timeline}`,
      b.businessType && `Business type: ${b.businessType}`,
      b.company && `Company: ${b.company}`,
      b.websiteUrl && `Website: ${b.websiteUrl}`,
      b.toolsFocus && `Tools / interest: ${b.toolsFocus}`,
    ]
      .filter(Boolean)
      .join("\n");

    const contactRow: Omit<InsertContact, "createdAt"> = {
      name: b.name,
      email: b.email,
      subject: SUBJECT,
      message,
      phone: null,
      company: b.company || null,
      projectType: "Free growth tools",
      budget: null,
      timeframe: b.timeline,
      newsletter: false,
      ageRange: null,
      gender: null,
      occupation: null,
      companySize: null,
      pricingEstimate: null,
    };

    const savedContact = await storage.createContact(contactRow);

    const submittedAt = new Date().toISOString();
    const customFields = {
      firstTouchSource: "free_growth_tools",
      primaryGoal: b.primaryGoal,
      timeline: b.timeline,
      websiteUrl: b.websiteUrl || undefined,
      businessType: b.businessType || undefined,
      companyName: b.company || undefined,
      freeToolsInterest: b.toolsFocus || undefined,
      freeToolsHubSubmittedAt: submittedAt,
      qualificationSubmitted: true,
    };

    try {
      await ensureCrmLeadFromFormSubmission({
        email: savedContact.email,
        name: savedContact.name,
        phone: savedContact.phone ?? undefined,
        company: savedContact.company ?? undefined,
        contactId: savedContact.id,
        attribution: {
          utm_source: b.utm_source ?? null,
          utm_medium: b.utm_medium ?? null,
          utm_campaign: b.utm_campaign ?? null,
          referrer: b.referrer ?? null,
          landing_page: b.landing_page ?? "/free-growth-tools",
          visitorId: b.visitorId ?? null,
        },
        customFields,
        demographics: {
          industry: b.businessType?.trim() || undefined,
        },
      });
    } catch (err) {
      console.warn("[free-growth-tools/lead] CRM ensure failed:", err);
    }

    try {
      await emailService.sendNotification({
        type: "contact",
        data: {
          name: b.name,
          email: b.email,
          subject: SUBJECT,
          message,
        },
      });
    } catch (err) {
      console.warn("[free-growth-tools/lead] Admin email failed:", err);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/free-growth-tools/lead:", e);
    return NextResponse.json({ message: "Could not save your details. Try again." }, { status: 500 });
  }
}
