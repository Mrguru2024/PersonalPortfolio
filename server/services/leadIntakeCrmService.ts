/**
 * Unified admin "lead intake" listing and CRM import for growth diagnosis reports,
 * funnel/diagnosis quiz leads, and project assessments. Optional OpenAI classification.
 */

import OpenAI from "@server/openai/nodeClient";
import { desc, eq, isNull } from "drizzle-orm";
import { db } from "@server/db";
import { storage } from "@server/storage";
import {
  growthDiagnosisReports,
  growthFunnelLeads,
  projectAssessments,
} from "@shared/schema";
import type { InsertCrmContact } from "@shared/crmSchema";
import type { LeadIntakeKind } from "@shared/leadIntakeTypes";
import { ensureCrmLeadFromFormSubmission } from "@server/services/leadFromFormService";
import { mergeSegmentTags } from "@server/services/leadSegmentationService";

export type { LeadIntakeKind } from "@shared/leadIntakeTypes";

export interface LeadIntakeListItem {
  kind: LeadIntakeKind;
  id: number;
  email: string | null;
  name: string | null;
  company: string | null;
  summary: string;
  scoreLabel: string | null;
  createdAt: string;
  crmContactId: number | null;
  /** True when email exists on a CRM contact (may already be enriched). */
  inCrm: boolean;
}

const ALLOWED_INTENT = new Set(["low_intent", "moderate_intent", "high_intent", "hot_lead"]);
const ALLOWED_LIFECYCLE = new Set(["cold", "warm", "qualified", "sales_ready"]);

export interface AiClassification {
  intentLevel?: string | null;
  lifecycleStage?: string | null;
  tags: string[];
  industry?: string | null;
  notesSummary?: string | null;
}

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Build a compact text block for the model (no full HTML / huge payloads). */
function buildClassificationContext(kind: LeadIntakeKind, payload: Record<string, unknown>): string {
  const lines: string[] = [`Submission type: ${kind}`];
  if (kind === "growth_diagnosis") {
    lines.push(`URL: ${payload.url ?? ""}`);
    lines.push(`Email: ${payload.email ?? ""}`);
    lines.push(`Business type: ${payload.businessType ?? ""}`);
    lines.push(`Primary goal: ${payload.primaryGoal ?? ""}`);
    lines.push(`Overall score: ${payload.overallScore ?? ""}`);
    lines.push(`Pages analyzed: ${payload.pagesAnalyzed ?? ""}`);
  } else if (kind === "funnel_lead") {
    lines.push(`Name: ${payload.name ?? ""}`);
    lines.push(`Email: ${payload.email ?? ""}`);
    lines.push(`Business: ${payload.businessName ?? ""}`);
    lines.push(`Scores total/brand/design/system: ${payload.totalScore}/${payload.brandScore}/${payload.designScore}/${payload.systemScore}`);
    lines.push(`Bottleneck: ${payload.primaryBottleneck ?? ""}`);
    lines.push(`Recommendation path: ${payload.recommendation ?? ""}`);
    lines.push(`Challenge: ${payload.mainChallenge ?? ""}`);
    lines.push(`Timeline: ${payload.timeline ?? ""}`);
    lines.push(`Budget: ${payload.budgetRange ?? ""}`);
  } else {
    lines.push(`Name: ${payload.name ?? ""}`);
    lines.push(`Email: ${payload.email ?? ""}`);
    lines.push(`Company: ${payload.company ?? ""}`);
    lines.push(`Role: ${payload.role ?? ""}`);
    lines.push(`Status: ${payload.status ?? ""}`);
    const ad = payload.assessmentData;
    if (ad && typeof ad === "object") {
      const o = ad as Record<string, unknown>;
      lines.push(`Project: ${o.projectName ?? o.projectType ?? ""}`);
      lines.push(`Message excerpt: ${String(o.message ?? o.description ?? "").slice(0, 400)}`);
    }
  }
  return lines.join("\n").slice(0, 3500);
}

export async function classifyIntakeWithAi(
  kind: LeadIntakeKind,
  payload: Record<string, unknown>
): Promise<AiClassification | null> {
  const client = getOpenAI();
  if (!client) return null;

  const context = buildClassificationContext(kind, payload);
  try {
    const res = await client.chat.completions.create({
      model: process.env.LEAD_INTAKE_AI_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.25,
      max_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You classify marketing/lead submissions for a web agency CRM. Return ONLY valid JSON with keys:
intentLevel (one of: low_intent, moderate_intent, high_intent, hot_lead),
lifecycleStage (one of: cold, warm, qualified, sales_ready),
tags (array of 3-8 short snake_case strings, e.g. audit_interested, high_ticket, local_service, startup, needs_redesign),
industry (short guess or empty string),
notesSummary (one or two sentences for internal sales notes; no PII beyond what is in the input).
Be conservative: use hot_lead only for very strong buying signals.`,
        },
        { role: "user", content: context },
      ],
    });
    const raw = res.choices[0]?.message?.content?.trim() ?? "";
    const parsed = safeJsonParse<Record<string, unknown>>(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const intentLevel =
      typeof parsed.intentLevel === "string" && ALLOWED_INTENT.has(parsed.intentLevel)
        ? parsed.intentLevel
        : null;
    const lifecycleStage =
      typeof parsed.lifecycleStage === "string" && ALLOWED_LIFECYCLE.has(parsed.lifecycleStage)
        ? parsed.lifecycleStage
        : null;
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags
          .filter((t): t is string => typeof t === "string" && /^[a-z0-9_]{2,40}$/i.test(t))
          .map((t) => t.toLowerCase())
          .slice(0, 12)
      : [];
    const industry =
      typeof parsed.industry === "string" && parsed.industry.trim() ? parsed.industry.trim().slice(0, 120) : null;
    const notesSummary =
      typeof parsed.notesSummary === "string" && parsed.notesSummary.trim()
        ? parsed.notesSummary.trim().slice(0, 800)
        : null;

    return { intentLevel, lifecycleStage, tags, industry, notesSummary };
  } catch (e) {
    console.error("classifyIntakeWithAi error:", e);
    return null;
  }
}

async function mapEmailsToCrmIds(emails: string[]): Promise<Map<string, number>> {
  const normalized = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (normalized.length === 0) return new Map();
  const contacts = await storage.getCrmContactsByEmails(normalized);
  const m = new Map<string, number>();
  for (const c of contacts) {
    m.set(c.email.trim().toLowerCase(), c.id);
  }
  return m;
}

export async function listLeadIntakeItems(limitPerSource = 45): Promise<LeadIntakeListItem[]> {
  const lim = Math.min(Math.max(limitPerSource, 5), 80);

  const [diagRows, funnelRows, assessRows] = await Promise.all([
    db
      .select({
        id: growthDiagnosisReports.id,
        reportId: growthDiagnosisReports.reportId,
        url: growthDiagnosisReports.url,
        email: growthDiagnosisReports.email,
        businessType: growthDiagnosisReports.businessType,
        primaryGoal: growthDiagnosisReports.primaryGoal,
        overallScore: growthDiagnosisReports.overallScore,
        pagesAnalyzed: growthDiagnosisReports.pagesAnalyzed,
        createdAt: growthDiagnosisReports.createdAt,
      })
      .from(growthDiagnosisReports)
      .orderBy(desc(growthDiagnosisReports.createdAt))
      .limit(lim),
    db
      .select()
      .from(growthFunnelLeads)
      .orderBy(desc(growthFunnelLeads.createdAt))
      .limit(lim),
    db
      .select({
        id: projectAssessments.id,
        name: projectAssessments.name,
        email: projectAssessments.email,
        company: projectAssessments.company,
        status: projectAssessments.status,
        assessmentData: projectAssessments.assessmentData,
        createdAt: projectAssessments.createdAt,
      })
      .from(projectAssessments)
      .where(isNull(projectAssessments.deletedAt))
      .orderBy(desc(projectAssessments.createdAt))
      .limit(lim),
  ]);

  const emails: string[] = [];
  for (const r of diagRows) {
    if (r.email?.trim()) emails.push(r.email.trim());
  }
  for (const r of funnelRows) {
    if (r.email?.trim()) emails.push(r.email.trim());
  }
  for (const r of assessRows) {
    if (r.email?.trim()) emails.push(r.email.trim());
  }
  const crmByEmail = await mapEmailsToCrmIds(emails);

  const items: LeadIntakeListItem[] = [];

  for (const r of diagRows) {
    const em = r.email?.trim() || null;
    const crmId = em ? crmByEmail.get(em.toLowerCase()) ?? null : null;
    items.push({
      kind: "growth_diagnosis",
      id: r.id,
      email: em,
      name: null,
      company: null,
      summary: [r.url, r.businessType, r.primaryGoal].filter(Boolean).join(" · ") || "Growth diagnosis",
      scoreLabel: r.overallScore != null ? String(r.overallScore) : null,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      crmContactId: crmId,
      inCrm: crmId != null,
    });
  }

  for (const r of funnelRows) {
    const em = r.email?.trim() || null;
    const crmId = em ? crmByEmail.get(em.toLowerCase()) ?? null : null;
    items.push({
      kind: "funnel_lead",
      id: r.id,
      email: em,
      name: r.name?.trim() || null,
      company: r.businessName?.trim() || null,
      summary: `Quiz lead · ${r.primaryBottleneck} → ${r.recommendation}`,
      scoreLabel: r.totalScore != null ? String(r.totalScore) : null,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      crmContactId: crmId,
      inCrm: crmId != null,
    });
  }

  for (const r of assessRows) {
    const em = r.email?.trim() || null;
    const crmId = em ? crmByEmail.get(em.toLowerCase()) ?? null : null;
    const ad = r.assessmentData && typeof r.assessmentData === "object" ? (r.assessmentData as Record<string, unknown>) : {};
    const projectName = typeof ad.projectName === "string" ? ad.projectName : "";
    items.push({
      kind: "assessment",
      id: r.id,
      email: em,
      name: r.name?.trim() || null,
      company: r.company?.trim() || null,
      summary: projectName || `Assessment (${r.status})`,
      scoreLabel: r.status,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      crmContactId: crmId,
      inCrm: crmId != null,
    });
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items.slice(0, lim * 3);
}

export interface ImportIntakeResult {
  kind: LeadIntakeKind;
  id: number;
  ok: boolean;
  crmContactId?: number;
  error?: string;
  aiUsed?: boolean;
}

export async function importIntakeItemToCrm(
  kind: LeadIntakeKind,
  id: number,
  options: { useAi?: boolean }
): Promise<ImportIntakeResult> {
  const useAi = options.useAi === true;

  try {
    if (kind === "growth_diagnosis") {
      const [row] = await db
        .select()
        .from(growthDiagnosisReports)
        .where(eq(growthDiagnosisReports.id, id))
        .limit(1);
      if (!row) return { kind, id, ok: false, error: "Report not found" };
      const email = row.email?.trim();
      if (!email) return { kind, id, ok: false, error: "No email on report; cannot create CRM lead" };

      const name = email.split("@")[0] || "Growth diagnosis lead";
      const payload: Record<string, unknown> = {
        url: row.url,
        email: row.email,
        businessType: row.businessType,
        primaryGoal: row.primaryGoal,
        overallScore: row.overallScore,
        pagesAnalyzed: row.pagesAnalyzed,
      };

      const customFields: Record<string, unknown> = {
        intakeSource: "growth_diagnosis_engine",
        growthDiagnosisReportId: row.id,
        growthDiagnosisReportUuid: row.reportId,
        auditedUrl: row.url,
        diagnosisOverallScore: row.overallScore,
        diagnosisPagesAnalyzed: row.pagesAnalyzed,
      };

      let ai: AiClassification | null = null;
      if (useAi) ai = await classifyIntakeWithAi(kind, payload);

      const lead = await ensureCrmLeadFromFormSubmission({
        email,
        name,
        company: tryHostnameCompany(row.url),
        attribution: { utm_source: "growth_diagnosis", landing_page: "/growth-diagnosis" },
        customFields,
        demographics: {
          industry: ai?.industry ?? row.businessType ?? undefined,
        },
      });
      if (!lead) return { kind, id, ok: false, error: "CRM ensure failed" };

      await applyAiCrmPatch(lead.id, lead.tags, ai, lead.notesSummary);
      return { kind, id, ok: true, crmContactId: lead.id, aiUsed: !!ai };
    }

    if (kind === "funnel_lead") {
      const [row] = await db.select().from(growthFunnelLeads).where(eq(growthFunnelLeads.id, id)).limit(1);
      if (!row) return { kind, id, ok: false, error: "Funnel lead not found" };
      const email = row.email?.trim();
      if (!email) return { kind, id, ok: false, error: "No email; cannot create CRM lead" };
      const name = row.name?.trim() || email.split("@")[0] || "Funnel lead";

      const payload: Record<string, unknown> = {
        name: row.name,
        email: row.email,
        businessName: row.businessName,
        totalScore: row.totalScore,
        brandScore: row.brandScore,
        designScore: row.designScore,
        systemScore: row.systemScore,
        primaryBottleneck: row.primaryBottleneck,
        recommendation: row.recommendation,
        mainChallenge: row.mainChallenge,
        timeline: row.timeline,
        budgetRange: row.budgetRange,
      };

      const customFields: Record<string, unknown> = {
        intakeSource: "growth_funnel_quiz",
        funnelLeadId: row.id,
        diagnosisScore: row.totalScore,
        diagnosisBreakdown: { brand: row.brandScore, design: row.designScore, system: row.systemScore },
        primaryBottleneck: row.primaryBottleneck,
        recommendedBrandPath: row.recommendation,
        mainChallenge: row.mainChallenge ?? undefined,
        timeline: row.timeline ?? undefined,
        budgetRange: row.budgetRange ?? undefined,
        websiteUrl: row.website ?? undefined,
        monthlyRevenueRange: row.monthlyRevenue ?? undefined,
      };

      let ai: AiClassification | null = null;
      if (useAi) ai = await classifyIntakeWithAi(kind, payload);

      const lead = await ensureCrmLeadFromFormSubmission({
        email,
        name,
        company: row.businessName?.trim() || undefined,
        attribution: { utm_source: "funnel_quiz", landing_page: "/diagnosis" },
        customFields,
        demographics: {
          industry: ai?.industry ?? undefined,
        },
      });
      if (!lead) return { kind, id, ok: false, error: "CRM ensure failed" };

      await applyAiCrmPatch(lead.id, lead.tags, ai, lead.notesSummary);
      return { kind, id, ok: true, crmContactId: lead.id, aiUsed: !!ai };
    }

    const row = await storage.getAssessmentById(id);
    if (!row) return { kind, id, ok: false, error: "Assessment not found" };
    const email = row.email?.trim();
    if (!email) return { kind, id, ok: false, error: "No email; cannot create CRM lead" };

    const payload: Record<string, unknown> = {
      name: row.name,
      email: row.email,
      company: row.company,
      role: row.role,
      status: row.status,
      assessmentData: row.assessmentData,
    };

    const ad = row.assessmentData && typeof row.assessmentData === "object" ? row.assessmentData : {};
    const customFields: Record<string, unknown> = {
      intakeSource: "project_assessment",
      projectAssessmentId: row.id,
      assessmentStatus: row.status,
      assessmentDataSummary: typeof ad === "object" ? JSON.stringify(ad).slice(0, 4000) : undefined,
    };

    let ai: AiClassification | null = null;
    if (useAi) ai = await classifyIntakeWithAi(kind, payload);

    const lead = await ensureCrmLeadFromFormSubmission({
      email,
      name: row.name?.trim() || email.split("@")[0] || "Assessment lead",
      phone: row.phone?.trim() || undefined,
      company: row.company?.trim() || undefined,
      attribution: { utm_source: "project_assessment", landing_page: "/assessment" },
      customFields,
      demographics: {
        occupation: row.role?.trim() || undefined,
        industry: ai?.industry ?? undefined,
      },
    });
    if (!lead) return { kind, id, ok: false, error: "CRM ensure failed" };

    await applyAiCrmPatch(lead.id, lead.tags, ai, lead.notesSummary);
    return { kind, id, ok: true, crmContactId: lead.id, aiUsed: !!ai };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { kind, id, ok: false, error: msg };
  }
}

function tryHostnameCompany(url: string): string | undefined {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "") || undefined;
  } catch {
    return undefined;
  }
}

async function applyAiCrmPatch(
  contactId: number,
  existingTags: string[] | null | undefined,
  ai: AiClassification | null,
  existingNotesSummary?: string | null
) {
  let tags = mergeSegmentTags(existingTags ?? [], ["imported_via_intake_hub"]);
  if (ai?.tags?.length) {
    tags = mergeSegmentTags(tags, ai.tags);
  }
  const patch: Record<string, unknown> = { tags };
  if (ai?.intentLevel) patch.intentLevel = ai.intentLevel;
  if (ai?.lifecycleStage) patch.lifecycleStage = ai.lifecycleStage;
  if (ai?.industry) patch.industry = ai.industry;
  if (ai?.notesSummary) {
    const prev = existingNotesSummary?.trim();
    patch.notesSummary = (prev ? `${prev}\n\n` : "") + ai.notesSummary;
    const ns = String(patch.notesSummary);
    if (ns.length > 2000) patch.notesSummary = ns.slice(0, 2000);
  }
  await storage.updateCrmContact(contactId, patch as Partial<InsertCrmContact>);
}
