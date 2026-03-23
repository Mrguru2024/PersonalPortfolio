import { NextRequest, NextResponse } from "next/server";
import { portfolioController } from "@server/controllers/portfolioController";
import { createMockResponse } from "@/lib/api-helpers";

const SUBJECT = "PPC, CRM & Lead Growth Consultation Request";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const businessName = String(body.businessName ?? body.company ?? "").trim();
    const name = String(body.name ?? body.contactName ?? businessName).trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim() || undefined;
    const websiteUrl = String(body.websiteUrl ?? body.website ?? "").trim() || "";
    const primaryFocus = String(body.primaryFocus ?? "").trim();
    const crmSituation = String(body.crmSituation ?? "").trim();
    const monthlyAdSpendRaw = String(body.monthlyAdSpend ?? "").trim();
    const monthlyAdSpend =
      monthlyAdSpendRaw && !/^prefer[_\s]?not$/i.test(monthlyAdSpendRaw) ? monthlyAdSpendRaw : "";
    const timeline = String(body.timeline ?? "").trim();
    const notes = String(body.notes ?? "").trim();
    const adPlatforms =
      Array.isArray(body.adPlatforms) && body.adPlatforms.length > 0
        ? body.adPlatforms.map((value: unknown) => String(value).trim()).filter(Boolean)
        : [];

    if (!name || !email) {
      return NextResponse.json({ message: "Name and email are required" }, { status: 400 });
    }
    if (!primaryFocus) {
      return NextResponse.json({ message: "Primary focus is required" }, { status: 400 });
    }
    if (!crmSituation) {
      return NextResponse.json({ message: "CRM / pipeline context is required" }, { status: 400 });
    }

    const message = [
      `Lead magnet: PPC / CRM / conversion consultation`,
      primaryFocus && `Primary focus: ${primaryFocus}`,
      crmSituation && `CRM / pipeline today: ${crmSituation}`,
      adPlatforms.length > 0 && `Ad platforms: ${adPlatforms.join(", ")}`,
      monthlyAdSpend && `Monthly ad spend (approx.): ${monthlyAdSpend}`,
      websiteUrl && `Website: ${websiteUrl}`,
      timeline && `Timeline: ${timeline}`,
      notes && `Additional notes: ${notes}`,
    ]
      .filter(Boolean)
      .join("\n");

    const contactBody = {
      name,
      email,
      company: businessName || undefined,
      phone: phone || undefined,
      projectType: primaryFocus,
      budget: monthlyAdSpend || undefined,
      timeframe: timeline || undefined,
      message: message || SUBJECT,
      newsletter: false,
      subject: SUBJECT,
      industry: crmSituation || undefined,
      ageRange: (body.ageRange ?? body.age_range ?? "").trim() || undefined,
      gender: (body.gender ?? "").trim() || undefined,
      occupation: (body.occupation ?? "").trim() || undefined,
      companySize: (body.companySize ?? body.company_size ?? "").trim() || undefined,
      utm_source: body.utm_source ?? undefined,
      utm_medium: body.utm_medium ?? undefined,
      utm_campaign: body.utm_campaign ?? undefined,
      referrer: body.referrer ?? undefined,
      landing_page: body.landing_page ?? body.landingPage ?? "/ppc-lead-system",
      visitorId: body.visitorId ?? undefined,
    };

    const mockReq = {
      body: contactBody,
      headers: {
        "x-forwarded-for": req.headers.get("x-forwarded-for") || "",
      },
      ip:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1",
    } as any;

    const { mockRes, getResponse } = createMockResponse();
    await portfolioController.submitContactForm(mockReq, mockRes);

    const response = getResponse();
    if (!response) {
      return NextResponse.json({ error: "No response from controller" }, { status: 500 });
    }

    return response;
  } catch (error) {
    console.error("Error in POST /api/ppc-lead-consultation:", error);
    return NextResponse.json({ message: "Failed to submit request" }, { status: 500 });
  }
}
