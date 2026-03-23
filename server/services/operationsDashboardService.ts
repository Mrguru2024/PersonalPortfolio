import { db } from "@server/db";
import { storage } from "@server/storage";
import { listLeadIntakeItems } from "@server/services/leadIntakeCrmService";
import {
  growthDiagnosisReports,
  growthFunnelLeads,
  internalCmsDocuments,
} from "@shared/schema";
import { desc } from "drizzle-orm";
import { projects as staticProjects } from "@/lib/data";
import type {
  AiActionItem,
  CaseStudyWorkflowItem,
  ContentHealthIssue,
  DiagnosticActivityRow,
  LeadSnapshotItem,
  OperationsDashboardPayload,
  OperationsQuickAction,
  PublishingQueueItem,
} from "@/lib/operations-dashboard/types";

const DIAGNOSTIC_QUICK_ACTIONS: OperationsQuickAction[] = [
  {
    key: "review_new_diagnostics",
    label: "Review New Diagnostics",
    href: "/admin/lead-intake?tab=growth_diagnosis",
    description: "Open new automated and quiz-based diagnostic submissions.",
    section: "diagnostics",
  },
  {
    key: "create_case_study",
    label: "Create Case Study",
    href: "/admin/content-studio/documents",
    description: "Start a new proof asset in Content Studio.",
    section: "case_studies",
  },
  {
    key: "review_qualified_leads",
    label: "Review Qualified Leads",
    href: "/admin/crm/pipeline?stage=qualified",
    description: "Jump directly to high-intent leads in CRM pipeline.",
    section: "leads",
  },
  {
    key: "open_publishing_queue",
    label: "Open Publishing Queue",
    href: "/admin/content-studio/workflow",
    description: "Review ready items and publishing logs.",
    section: "publishing",
  },
  {
    key: "generate_content_with_ai",
    label: "Generate Content with AI",
    href: "/admin/content-studio/documents",
    description: "Open AI-powered content actions inside Content Studio.",
    section: "ai",
  },
];

const AI_ACTIONS: AiActionItem[] = [
  {
    key: "generate_case_study_draft",
    label: "Generate Case Study Draft",
    description: "Start a case-study narrative draft with AI assistance.",
    href: "/admin/content-studio/documents",
  },
  {
    key: "improve_existing_content",
    label: "Improve Existing Content",
    description: "Run AI analysis and refine existing document quality.",
    href: "/admin/content-studio/documents",
  },
  {
    key: "create_social_posts",
    label: "Create Social Posts",
    description: "Produce social-ready derivatives from existing proof.",
    href: "/admin/content-studio/calendar",
  },
  {
    key: "generate_email_version",
    label: "Generate Email Version",
    description: "Adapt proof content into newsletter-ready format.",
    href: "/admin/content-studio/documents",
  },
  {
    key: "create_proposal_snippet",
    label: "Create Proposal Snippet",
    description: "Generate a concise proof excerpt for CRM proposals.",
    href: "/admin/crm/proposal-prep",
  },
  {
    key: "rewrite_cta",
    label: "Rewrite CTA",
    description: "Generate stronger CTA variants for conversion pages.",
    href: "/admin/content-studio/documents",
  },
];

type LightweightDocument = {
  id: number;
  title: string;
  bodyHtml: string;
  bodyMarkdown: string | null;
  excerpt: string | null;
  tags: string[] | null;
  categories: string[] | null;
  contentType: string;
  workflowStatus: string;
  visibility: string;
  updatedAt: Date;
  slug: string | null;
};

function statusLabel(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function sourceLabel(raw: string | null | undefined): string {
  if (!raw) return "Unknown";
  return statusLabel(raw);
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function formatOpportunity(score: number | null): string {
  if (score == null) return "Needs score review";
  const scoreGap = Math.max(0, 100 - score);
  if (scoreGap >= 45) return "High revenue opportunity";
  if (scoreGap >= 25) return "Medium revenue opportunity";
  return "Focused optimization opportunity";
}

function recommendationFromReportPayload(payload: unknown): string {
  const categoryScores =
    payload &&
    typeof payload === "object" &&
    (payload as { summary?: { categoryScores?: Array<{ key?: string; score?: number }> } }).summary
      ?.categoryScores;

  if (!Array.isArray(categoryScores) || categoryScores.length === 0) {
    return "Growth system follow-up";
  }

  const lowest = [...categoryScores]
    .filter((c) => typeof c?.score === "number")
    .sort((a, b) => (a.score ?? 100) - (b.score ?? 100))[0];
  const key = lowest?.key ?? "";

  switch (key) {
    case "conversion_readiness":
      return "Lead capture & conversion system";
    case "content_clarity":
      return "Messaging & content system";
    case "trust_authority":
      return "Proof & authority system";
    case "seo_foundations":
    case "local_visibility":
      return "Visibility & SEO system";
    case "mobile_experience":
    case "performance":
    case "accessibility_basics":
      return "Technical performance system";
    default:
      return "Growth system follow-up";
  }
}

function recommendationFromFunnelPath(path: string | null | undefined): string {
  switch (path) {
    case "style_studio":
      return "Style Studio Branding system";
    case "macon_designs":
      return "Macon Designs system";
    case "ascendra":
      return "Ascendra growth system";
    default:
      return "Growth strategy follow-up";
  }
}

function isCaseStudyCandidate(doc: LightweightDocument): boolean {
  const tags = Array.isArray(doc.tags) ? doc.tags.join(" ") : "";
  const categories = Array.isArray(doc.categories) ? doc.categories.join(" ") : "";
  const hay = `${doc.title} ${doc.contentType} ${tags} ${categories}`.toLowerCase();
  return (
    hay.includes("case study") ||
    hay.includes("case-study") ||
    hay.includes("customer story") ||
    hay.includes("success story") ||
    hay.includes("proof")
  );
}

function checkContentElements(doc: LightweightDocument): {
  missingElements: string[];
  completionScore: number;
  seoReady: boolean;
} {
  const body = `${doc.bodyHtml ?? ""}\n${doc.bodyMarkdown ?? ""}\n${doc.excerpt ?? ""}`;
  const normalized = body.toLowerCase();
  const hasHeadline = doc.title.trim().length >= 8;
  const hasResults = /(results?|increase|decrease|growth|conversion|roi|revenue|kpi|\d+%)/i.test(normalized);
  const hasVisuals = /<img[\s>]|!\[[^\]]*]\([^)]+\)/i.test(body);
  const hasCta = /<(a|button)[\s>]|book|schedule|start|contact|apply|get started|request/i.test(normalized);
  const hasSeo =
    doc.title.trim().length >= 20 &&
    (doc.excerpt?.trim().length ?? 0) >= 40 &&
    Array.isArray(doc.tags) &&
    doc.tags.length > 0;

  const missingElements: string[] = [];
  if (!hasHeadline) missingElements.push("Missing headline");
  if (!hasResults) missingElements.push("Missing results");
  if (!hasVisuals) missingElements.push("Missing visuals");
  if (!hasCta) missingElements.push("Missing CTA");
  if (!hasSeo) missingElements.push("Missing SEO");

  const checks = [hasHeadline, hasResults, hasVisuals, hasCta, hasSeo];
  const completionScore = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  return { missingElements, completionScore, seoReady: hasSeo };
}

function opportunityScore(deal: {
  aiPriorityScore: number | null;
  leadScore: number | null;
  value: number | null;
  pipelineStage: string | null;
}): number {
  let score = 0;
  if (deal.aiPriorityScore != null) score += deal.aiPriorityScore;
  else if (deal.leadScore != null) score += deal.leadScore;
  else if (deal.value != null) score += Math.min(100, Math.round(deal.value / 1500));

  if (deal.pipelineStage === "proposal_ready") score += 20;
  if (deal.pipelineStage === "negotiation") score += 25;
  if (deal.pipelineStage === "qualified") score += 15;
  return Math.min(100, score);
}

function extractBusinessTypeFromFunnelAnswers(answers: unknown): string {
  if (!answers || typeof answers !== "object") return "Business (quiz lead)";
  const a = answers as Record<string, unknown>;
  const candidates = [a.businessType, a.business_type, a.industry, a.businessModel];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return statusLabel(candidate.trim());
  }
  return "Business (quiz lead)";
}

export async function getOperationsDashboardPayload(): Promise<OperationsDashboardPayload> {
  const generatedAt = new Date().toISOString();

  const quickActions = DIAGNOSTIC_QUICK_ACTIONS;
  const aiActions = AI_ACTIONS;

  const intakeMap = new Map<string, { crmContactId: number | null; inCrm: boolean }>();
  let newDiagnosticsToReview = 0;
  try {
    const intake = await listLeadIntakeItems(80);
    for (const item of intake) {
      intakeMap.set(`${item.kind}:${item.id}`, {
        crmContactId: item.crmContactId,
        inCrm: item.inCrm,
      });
    }
    newDiagnosticsToReview = intake.filter((i) => i.kind !== "assessment" && !i.inCrm).length;
  } catch {
    newDiagnosticsToReview = 0;
  }

  let diagnostics: DiagnosticActivityRow[] = [];
  try {
    const [growthRows, funnelRows] = await Promise.all([
      db
        .select({
          id: growthDiagnosisReports.id,
          businessType: growthDiagnosisReports.businessType,
          overallScore: growthDiagnosisReports.overallScore,
          createdAt: growthDiagnosisReports.createdAt,
          reportPayload: growthDiagnosisReports.reportPayload,
          url: growthDiagnosisReports.url,
        })
        .from(growthDiagnosisReports)
        .orderBy(desc(growthDiagnosisReports.createdAt))
        .limit(12),
      db
        .select({
          id: growthFunnelLeads.id,
          answers: growthFunnelLeads.answers,
          totalScore: growthFunnelLeads.totalScore,
          recommendation: growthFunnelLeads.recommendation,
          createdAt: growthFunnelLeads.createdAt,
        })
        .from(growthFunnelLeads)
        .orderBy(desc(growthFunnelLeads.createdAt))
        .limit(12),
    ]);

    const growthMapped: DiagnosticActivityRow[] = growthRows.map((row) => {
      let fallbackBusinessType = "Business (diagnostic)";
      try {
        fallbackBusinessType = new URL(row.url).hostname.replace(/^www\./, "");
      } catch {
        // Keep fallback value.
      }
      const linkMeta = intakeMap.get(`growth_diagnosis:${row.id}`);
      return {
        id: row.id,
        kind: "growth_diagnosis",
        businessType: row.businessType?.trim() || fallbackBusinessType,
        score: row.overallScore,
        revenueOpportunity: formatOpportunity(row.overallScore),
        recommendedSystem: recommendationFromReportPayload(row.reportPayload),
        createdAt: toIso(row.createdAt),
        crmContactId: linkMeta?.crmContactId ?? null,
        breakdownHref: `/api/admin/growth-diagnosis/reports/${row.id}/export?format=text`,
        recommendationHref: `/api/admin/growth-diagnosis/reports/${row.id}/export?format=json`,
      };
    });

    const funnelMapped: DiagnosticActivityRow[] = funnelRows.map((row) => {
      const linkMeta = intakeMap.get(`funnel_lead:${row.id}`);
      return {
        id: row.id,
        kind: "funnel_lead",
        businessType: extractBusinessTypeFromFunnelAnswers(row.answers),
        score: row.totalScore,
        revenueOpportunity: formatOpportunity(row.totalScore),
        recommendedSystem: recommendationFromFunnelPath(row.recommendation),
        createdAt: toIso(row.createdAt),
        crmContactId: linkMeta?.crmContactId ?? null,
        breakdownHref: "/admin/lead-intake?tab=funnel_lead",
        recommendationHref: "/diagnosis/results",
      };
    });

    diagnostics = [...growthMapped, ...funnelMapped]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);
  } catch {
    diagnostics = [];
  }

  let rawDocuments: LightweightDocument[] = [];
  try {
    rawDocuments = await db
      .select({
        id: internalCmsDocuments.id,
        title: internalCmsDocuments.title,
        bodyHtml: internalCmsDocuments.bodyHtml,
        bodyMarkdown: internalCmsDocuments.bodyMarkdown,
        excerpt: internalCmsDocuments.excerpt,
        tags: internalCmsDocuments.tags,
        categories: internalCmsDocuments.categories,
        contentType: internalCmsDocuments.contentType,
        workflowStatus: internalCmsDocuments.workflowStatus,
        visibility: internalCmsDocuments.visibility,
        updatedAt: internalCmsDocuments.updatedAt,
        slug: internalCmsDocuments.slug,
      })
      .from(internalCmsDocuments)
      .orderBy(desc(internalCmsDocuments.updatedAt))
      .limit(200);
  } catch {
    rawDocuments = [];
  }

  const explicitCaseStudyDocs = rawDocuments.filter(isCaseStudyCandidate);
  const fallbackCaseStudyDocs =
    explicitCaseStudyDocs.length > 0
      ? explicitCaseStudyDocs
      : rawDocuments.filter((doc) =>
          ["blog_draft", "landing_copy", "campaign_brief", "newsletter_draft"].includes(doc.contentType),
        );

  const caseStudies: CaseStudyWorkflowItem[] = fallbackCaseStudyDocs.slice(0, 16).map((doc) => {
    const checks = checkContentElements(doc);
    return {
      id: doc.id,
      title: doc.title,
      workflowStatus: doc.workflowStatus,
      completionScore: checks.completionScore,
      missingElements: checks.missingElements,
      updatedAt: toIso(doc.updatedAt),
      contentType: doc.contentType,
      visibility: doc.visibility,
      seoReady: checks.seoReady,
    };
  });

  const publishingQueue: PublishingQueueItem[] = rawDocuments
    .filter((doc) => ["draft", "staged", "scheduled", "published"].includes(doc.workflowStatus))
    .slice(0, 12)
    .map((doc) => {
      const checks = checkContentElements(doc);
      return {
        id: doc.id,
        title: doc.title,
        workflowStatus: doc.workflowStatus,
        seoReady: checks.seoReady,
        updatedAt: toIso(doc.updatedAt),
        slug: doc.slug,
      };
    });

  let leads: LeadSnapshotItem[] = [];
  let qualifiedLeads = 0;
  try {
    const [crmStats, contacts, deals] = await Promise.all([
      storage.getCrmDashboardStats(),
      storage.getCrmContacts(),
      storage.getCrmDeals(),
    ]);

    const stageCounts = new Map(crmStats.leadsByPipelineStage.map((entry) => [entry.stage, entry.count]));
    qualifiedLeads =
      (stageCounts.get("qualified") ?? 0) +
      (stageCounts.get("proposal_ready") ?? 0) +
      (stageCounts.get("negotiation") ?? 0);

    const contactById = new Map(contacts.map((c) => [c.id, c]));
    const activeDeals = deals.filter((deal) =>
      ["qualified", "proposal_ready", "negotiation", "follow_up", "researching", "new_lead"].includes(
        deal.pipelineStage ?? "",
      ),
    );

    leads = activeDeals
      .map((deal) => {
        const contact = contactById.get(deal.contactId);
        if (!contact) return null;
        const score = opportunityScore(deal);
        const customFields =
          contact.customFields && typeof contact.customFields === "object"
            ? (contact.customFields as Record<string, unknown>)
            : {};
        const sourceRaw =
          (typeof customFields.intakeSource === "string" && customFields.intakeSource) ||
          contact.source ||
          contact.utmSource ||
          "unknown";

        let diagnosticHref = "/admin/lead-intake";
        if (typeof customFields.growthDiagnosisReportId === "number") {
          diagnosticHref = `/api/admin/growth-diagnosis/reports/${customFields.growthDiagnosisReportId}/export?format=text`;
        } else if (typeof customFields.funnelLeadId === "number") {
          diagnosticHref = "/admin/lead-intake?tab=funnel_lead";
        } else if (typeof customFields.projectAssessmentId === "number") {
          diagnosticHref = "/admin/lead-intake?tab=assessment";
        }

        const valueHint = deal.value != null ? ` · $${deal.value.toLocaleString()}` : "";
        return {
          contactId: contact.id,
          leadName: contact.name,
          business: contact.company ?? "Unknown business",
          source: sourceLabel(sourceRaw),
          opportunity: `${score}/100${valueHint}`,
          status: statusLabel(deal.pipelineStage ?? contact.status ?? "new"),
          diagnosticHref,
        } satisfies LeadSnapshotItem;
      })
      .filter((row): row is LeadSnapshotItem => row != null)
      .sort((a, b) => {
        const aScore = parseInt(a.opportunity.split("/")[0] ?? "0", 10);
        const bScore = parseInt(b.opportunity.split("/")[0] ?? "0", 10);
        return bScore - aScore;
      })
      .slice(0, 12);
  } catch {
    leads = [];
    qualifiedLeads = 0;
  }

  const caseStudyIssueCounter = new Map<string, number>();
  for (const item of caseStudies) {
    for (const missing of item.missingElements) {
      caseStudyIssueCounter.set(missing, (caseStudyIssueCounter.get(missing) ?? 0) + 1);
    }
  }
  const contentHealthIssues: ContentHealthIssue[] = [
    "Missing headline",
    "Missing results",
    "Missing visuals",
    "Missing CTA",
    "Missing SEO",
  ].map((label) => ({ label, count: caseStudyIssueCounter.get(label) ?? 0 }));

  const draftCaseStudies = caseStudies.filter(
    (item) => item.workflowStatus !== "published" && item.workflowStatus !== "archived",
  ).length;
  const publishedCaseStudyDocs = caseStudies.filter((item) => item.workflowStatus === "published").length;
  const publishedCaseStudies = Math.max(
    staticProjects.filter((project) => Boolean(project.synopsis?.caseStudy)).length,
    publishedCaseStudyDocs,
  );
  const contentMissingKeyElements = caseStudies.filter((item) => item.missingElements.length > 0).length;
  const itemsReadyToPublish = publishingQueue.filter(
    (item) => ["staged", "scheduled"].includes(item.workflowStatus) && item.seoReady,
  ).length;
  const averageCompletionScore =
    caseStudies.length > 0
      ? Math.round(caseStudies.reduce((sum, item) => sum + item.completionScore, 0) / caseStudies.length)
      : 0;

  return {
    generatedAt,
    summary: {
      newDiagnosticsToReview,
      qualifiedLeads,
      draftCaseStudies,
      publishedCaseStudies,
      contentMissingKeyElements,
      itemsReadyToPublish,
    },
    quickActions,
    diagnostics,
    caseStudies,
    publishingQueue,
    leads,
    aiActions,
    contentHealth: {
      averageCompletionScore,
      issues: contentHealthIssues,
    },
  };
}
