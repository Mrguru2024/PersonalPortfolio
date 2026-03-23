import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getSessionUser,
  resolveAscendraAccessFromSessionUser,
} from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { ensureCrmLeadFromFormSubmission } from "@server/services/leadFromFormService";
import { emailService } from "@server/services/emailService";
import { runOfferValuation } from "@server/services/offerValuationService";
import { logActivity } from "@server/services/crmFoundationService";
import { addScoreFromEvent } from "@server/services/leadScoringService";
import {
  buildPayloadFromContactId,
  fireWorkflows,
} from "@server/services/workflows/engine";
import { getLeadCustomFields } from "@shared/leadCustomFields";
import { canUseOfferValuation, sanitizePersonaTag } from "./lib";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  persona: z.string().trim().max(120).optional().nullable(),
  offerName: z.string().trim().min(1, "Offer name is required").max(200),
  description: z
    .string()
    .trim()
    .min(20, "Offer description is required")
    .max(8000),
  scores: z.object({
    dreamOutcome: z.number().min(1).max(10),
    perceivedLikelihood: z.number().min(1).max(10),
    timeDelay: z.number().min(1).max(10),
    effortAndSacrifice: z.number().min(1).max(10),
  }),
  aiEnabled: z.boolean().optional(),
  leadCapture: z
    .object({
      name: z.string().trim().min(1).max(120),
      email: z.string().trim().email(),
      businessType: z.string().trim().max(140).optional().nullable(),
    })
    .optional(),
  attribution: z
    .object({
      visitorId: z.string().trim().max(200).optional().nullable(),
      utm_source: z.string().trim().max(120).optional().nullable(),
      utm_medium: z.string().trim().max(120).optional().nullable(),
      utm_campaign: z.string().trim().max(180).optional().nullable(),
      referrer: z.string().trim().max(500).optional().nullable(),
      landing_page: z.string().trim().max(240).optional().nullable(),
    })
    .optional(),
});

function uniqueTags(existing: string[] | null | undefined, extra: string[]) {
  return [...new Set([...(existing ?? []), ...extra])];
}

async function attachPublicLeadAndAutomation(input: {
  name: string;
  email: string;
  businessType?: string | null;
  persona?: string | null;
  offerName: string;
  finalScore: number;
  attribution?: {
    visitorId?: string | null;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    referrer?: string | null;
    landing_page?: string | null;
  };
}) {
  const lead = await ensureCrmLeadFromFormSubmission({
    email: input.email,
    name: input.name,
    company: null,
    attribution: {
      utm_source: input.attribution?.utm_source ?? "offer_audit",
      utm_medium: input.attribution?.utm_medium ?? null,
      utm_campaign: input.attribution?.utm_campaign ?? null,
      referrer: input.attribution?.referrer ?? null,
      landing_page: input.attribution?.landing_page ?? "/offer-audit",
      visitorId: input.attribution?.visitorId ?? null,
    },
    customFields: {
      firstTouchSource: "offer_audit",
      valuationPersona: input.persona ?? undefined,
      latestOfferValuationScore: input.finalScore,
      latestOfferValuationAt: new Date().toISOString(),
      latestOfferValuationName: input.offerName,
    },
    demographics: {
      industry: input.businessType ?? undefined,
    },
  });

  if (!lead) return null;

  const personaTag = sanitizePersonaTag(input.persona);
  const tags = uniqueTags(lead.tags, [
    "offer_valuation",
    "offer_audit_lead",
    ...(personaTag ? [personaTag] : []),
  ]);

  const mergedCustom = {
    ...getLeadCustomFields(lead.customFields),
    latestOfferValuationScore: input.finalScore,
    latestOfferValuationAt: new Date().toISOString(),
    latestOfferValuationName: input.offerName,
    valuationPersona: input.persona ?? undefined,
  };

  await storage.updateCrmContact(lead.id, {
    source: "offer_audit",
    tags,
    customFields: mergedCustom,
  });

  const deals = await storage.getCrmDeals(lead.id);
  const hasOfferAuditDeal = deals.some(
    (d) => (d.serviceInterest ?? "").toLowerCase() === "new lead - offer audit",
  );
  if (!hasOfferAuditDeal) {
    await storage.createCrmDeal({
      contactId: lead.id,
      accountId: lead.accountId ?? null,
      title: `New Lead - Offer Audit | ${input.offerName}`.slice(0, 180),
      value: 0,
      stage: "qualification",
      pipelineStage: "new_lead",
      serviceInterest: "New Lead - Offer Audit",
      primaryPainPoint: "Offer clarity and conversion performance",
      businessGoal: "Improve offer conversion",
      source: "offer_audit",
      notesSummary: `Offer valuation submitted with score ${input.finalScore}/10.`,
    });
  }

  await logActivity(storage, {
    contactId: lead.id,
    type: "form_submission",
    title: "Offer valuation submitted",
    content: `Score ${input.finalScore}/10 · ${input.offerName}`,
    metadata: {
      formSource: "offer_audit",
      finalScore: input.finalScore,
      persona: input.persona ?? null,
    },
  }).catch(() => {});

  addScoreFromEvent(storage, lead.id, "calculator_complete", {
    page: "/offer-audit",
  }).catch(() => {});

  const workflowPayload = await buildPayloadFromContactId(storage, lead.id).catch(
    () => ({ contactId: lead.id }),
  );
  fireWorkflows(storage, "calculator_completed", {
    ...workflowPayload,
    formSource: "offer_audit",
  }).catch(() => {});

  return lead;
}

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    const role = resolveAscendraAccessFromSessionUser(sessionUser);
    if (role === "PUBLIC") {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get("limit") ?? "40", 10) || 40, 1),
      200,
    );
    if (role === "ADMIN") {
      const rows = await storage.listOfferValuations({ limit });
      return NextResponse.json({ items: rows });
    }
    const userId = Number(sessionUser?.id);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ items: [] });
    }
    const rows = await storage.listOfferValuations({ userId, limit });
    return NextResponse.json({ items: rows });
  } catch (error) {
    console.error("GET /api/offer-valuation:", error);
    return NextResponse.json(
      { message: "Failed to load valuations" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const settings = await storage.getOfferValuationSettings();
    const sessionUser = await getSessionUser(req);
    const role = resolveAscendraAccessFromSessionUser(sessionUser);
    const access = canUseOfferValuation(settings, role);
    if (!access.allowed) {
      return NextResponse.json(
        { message: access.reason ?? "Access denied" },
        { status: 403 },
      );
    }

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const b = parsed.data;
    const aiEnabled = b.aiEnabled ?? settings.aiDefaultEnabled;
    const valuation = await runOfferValuation({
      persona: b.persona,
      offerName: b.offerName,
      description: b.description,
      scores: b.scores,
      aiEnabled,
    });

    const isPublicRole = role === "PUBLIC";
    if (isPublicRole && settings.requireLeadCapture && !b.leadCapture) {
      return NextResponse.json({
        gated: true,
        preview: {
          finalScore: valuation.finalScore,
          scoreBand: valuation.scoreBand,
          message:
            "Submit your contact details to unlock the full diagnosis, upgraded offer, and strategic fixes.",
        },
      });
    }

    let userId: number | null = null;
    let leadId: number | null = null;
    const accessMode =
      role === "ADMIN"
        ? "internal_tool"
        : role === "PUBLIC"
          ? "lead_magnet"
          : "client_tool";

    if (isPublicRole && b.leadCapture) {
      const lead = await attachPublicLeadAndAutomation({
        name: b.leadCapture.name,
        email: b.leadCapture.email,
        businessType: b.leadCapture.businessType,
        persona: b.persona,
        offerName: b.offerName,
        finalScore: valuation.finalScore,
        attribution: b.attribution,
      });
      leadId = lead?.id ?? null;

      if (lead) {
        emailService
          .sendDirectMessageEmail({
            to: b.leadCapture.email,
            subject: `Your Offer Audit Results — ${b.offerName}`,
            body: `Hi ${b.leadCapture.name},

Your offer valuation score is ${valuation.finalScore}/10.

Top strategic fix:
- ${valuation.insights.strategicFixes[0] ?? "Clarify your core outcome and proof."}

Next step:
Book a strategy call to turn this into a conversion-focused execution plan: https://ascendra.ai/strategy-call
`,
            senderName: "Ascendra Technologies",
          })
          .catch(() => {});

        emailService
          .sendNotification({
            type: "contact",
            data: {
              name: b.leadCapture.name,
              email: b.leadCapture.email,
              subject: "New Offer Valuation lead",
              message: `Offer: ${b.offerName}
Score: ${valuation.finalScore}/10
Persona: ${b.persona ?? "N/A"}
Business type: ${b.leadCapture.businessType ?? "N/A"}`,
            },
          })
          .catch(() => {});
      }
    } else if (!isPublicRole) {
      userId = Number(sessionUser?.id);
      if (!Number.isFinite(userId)) userId = null;

      const userEmail =
        typeof sessionUser?.email === "string" ? sessionUser.email : null;
      if (userEmail) {
        const contacts = await storage.getCrmContactsByEmails([userEmail]);
        const contact = contacts[0];
        if (contact) {
          leadId = contact.id;
          const tags = uniqueTags(contact.tags, ["offer_valuation"]);
          await storage
            .updateCrmContact(contact.id, {
              tags,
              customFields: {
                ...getLeadCustomFields(contact.customFields),
                latestOfferValuationScore: valuation.finalScore,
                latestOfferValuationAt: new Date().toISOString(),
                latestOfferValuationName: b.offerName,
                valuationPersona: b.persona ?? undefined,
              },
            })
            .catch(() => {});
        }
      }
    }

    const saved = await storage.createOfferValuation({
      userId,
      leadId,
      accessMode,
      persona: b.persona ?? null,
      offerName: b.offerName,
      description: b.description,
      dreamOutcomeScore: valuation.inputsUsed.dreamOutcome,
      likelihoodScore: valuation.inputsUsed.perceivedLikelihood,
      timeDelayScore: valuation.inputsUsed.timeDelay,
      effortScore: valuation.inputsUsed.effortAndSacrifice,
      finalScore: valuation.finalScore,
      aiEnabled,
      insights: valuation.insights as Record<string, unknown>,
    });

    return NextResponse.json({
      ok: true,
      id: saved.id,
      finalScore: valuation.finalScore,
      rawScore: valuation.rawScore,
      scoreBand: valuation.scoreBand,
      aiUsed: valuation.aiUsed,
      insights: valuation.insights,
      leadId,
    });
  } catch (error) {
    console.error("POST /api/offer-valuation:", error);
    return NextResponse.json(
      { message: "Failed to complete offer valuation" },
      { status: 500 },
    );
  }
}

