import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@server/db";
import {
  crmContacts,
  growthDiagnosisReports,
  internalCmsDocuments,
} from "@shared/schema";
import { projects } from "@/lib/data";
import {
  deriveRecommendedSystem,
  deriveRevenueOpportunity,
  evaluateContentReadiness,
  isCaseStudyDocument,
  type OperationsDocumentRecord,
} from "@/lib/operations-dashboard";
import { buildGuaranteeSnapshotForClient } from "@server/services/guaranteeEngineService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const QUALIFIED_LEAD_STATUSES = ["qualified", "proposal", "negotiation"] as const;
const PUBLISHABLE_WORKFLOW_STATUSES = new Set([
  "draft",
  "staged",
  "scheduled",
  "published",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getTopBlockerTitle(reportPayload: unknown): string | null {
  if (!isRecord(reportPayload)) return null;
  const summary = reportPayload.summary;
  if (!isRecord(summary)) return null;
  const topBlockers = summary.topBlockers;
  if (!Array.isArray(topBlockers) || topBlockers.length === 0) return null;
  const first = topBlockers[0];
  if (!isRecord(first)) return null;
  return getString(first.title);
}

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  return new Date().toISOString();
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const [diagnosticRows, cmsRows, leadRows, qualifiedLeadCountRows] = await Promise.all([
      db
        .select({
          id: growthDiagnosisReports.id,
          reportId: growthDiagnosisReports.reportId,
          url: growthDiagnosisReports.url,
          email: growthDiagnosisReports.email,
          businessType: growthDiagnosisReports.businessType,
          primaryGoal: growthDiagnosisReports.primaryGoal,
          overallScore: growthDiagnosisReports.overallScore,
          reportPayload: growthDiagnosisReports.reportPayload,
          createdAt: growthDiagnosisReports.createdAt,
        })
        .from(growthDiagnosisReports)
        .orderBy(desc(growthDiagnosisReports.createdAt))
        .limit(60),
      db
        .select({
          id: internalCmsDocuments.id,
          title: internalCmsDocuments.title,
          contentType: internalCmsDocuments.contentType,
          workflowStatus: internalCmsDocuments.workflowStatus,
          visibility: internalCmsDocuments.visibility,
          slug: internalCmsDocuments.slug,
          excerpt: internalCmsDocuments.excerpt,
          bodyHtml: internalCmsDocuments.bodyHtml,
          bodyMarkdown: internalCmsDocuments.bodyMarkdown,
          tags: internalCmsDocuments.tags,
          categories: internalCmsDocuments.categories,
          personaTags: internalCmsDocuments.personaTags,
          updatedAt: internalCmsDocuments.updatedAt,
        })
        .from(internalCmsDocuments)
        .orderBy(desc(internalCmsDocuments.updatedAt))
        .limit(220),
      db
        .select({
          id: crmContacts.id,
          name: crmContacts.name,
          email: crmContacts.email,
          company: crmContacts.company,
          source: crmContacts.source,
          status: crmContacts.status,
          leadScore: crmContacts.leadScore,
          estimatedValue: crmContacts.estimatedValue,
          intentLevel: crmContacts.intentLevel,
          customFields: crmContacts.customFields,
          updatedAt: crmContacts.updatedAt,
          createdAt: crmContacts.createdAt,
        })
        .from(crmContacts)
        .where(eq(crmContacts.type, "lead"))
        .orderBy(desc(crmContacts.updatedAt))
        .limit(120),
      db
        .select({ count: sql<number>`count(*)` })
        .from(crmContacts)
        .where(
          and(
            eq(crmContacts.type, "lead"),
            inArray(crmContacts.status, [...QUALIFIED_LEAD_STATUSES]),
          ),
        ),
    ]);

    const crmIdByEmail = new Map<string, number>();
    for (const lead of leadRows) {
      const email = normalizeEmail(lead.email);
      if (!email) continue;
      crmIdByEmail.set(email, lead.id);
    }

    const diagnostics = diagnosticRows.slice(0, 10).map((row) => {
      const topBlockerTitle = getTopBlockerTitle(row.reportPayload);
      const normalizedEmail = normalizeEmail(row.email);
      const crmContactId = normalizedEmail ? crmIdByEmail.get(normalizedEmail) ?? null : null;
      const score = row.overallScore ?? null;
      return {
        id: row.id,
        reportId: row.reportId,
        businessType: getString(row.businessType) ?? "unsure",
        score,
        revenueOpportunity: deriveRevenueOpportunity(score),
        recommendedSystem: deriveRecommendedSystem({
          primaryGoal: row.primaryGoal,
          businessType: row.businessType,
          topBlockerTitle,
        }),
        recommendedSystemDetail: topBlockerTitle,
        date: toIso(row.createdAt),
        crmContactId,
      };
    });

    const newDiagnosticsToReview = diagnostics.filter((item) => item.crmContactId == null).length;

    const documentsWithReadiness = cmsRows.map((doc) => {
      const normalizedDoc: OperationsDocumentRecord = {
        ...doc,
        slug: doc.slug ?? null,
        excerpt: doc.excerpt ?? null,
        bodyHtml: doc.bodyHtml ?? null,
        bodyMarkdown: doc.bodyMarkdown ?? null,
      };
      const readiness = evaluateContentReadiness(normalizedDoc);
      return {
        ...normalizedDoc,
        readiness,
        isCaseStudy: isCaseStudyDocument(normalizedDoc),
      };
    });

    const caseStudyDocs = documentsWithReadiness.filter((doc) => doc.isCaseStudy);
    const caseStudyPipelineRows = caseStudyDocs
      .filter((doc) => doc.workflowStatus !== "archived")
      .slice(0, 8)
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        workflowStatus: doc.workflowStatus,
        completionScore: doc.readiness.completionScore,
        missingElements: doc.readiness.missingElements,
        updatedAt: toIso(doc.updatedAt),
        publicUrl: doc.slug ? `/blog/${doc.slug}` : null,
      }));

    const publishingCandidates =
      caseStudyDocs.length > 0
        ? caseStudyDocs.filter((doc) => PUBLISHABLE_WORKFLOW_STATUSES.has(doc.workflowStatus))
        : documentsWithReadiness.filter((doc) => PUBLISHABLE_WORKFLOW_STATUSES.has(doc.workflowStatus));

    const publishingQueue = publishingCandidates.slice(0, 10).map((doc) => ({
      id: doc.id,
      title: doc.title,
      workflowStatus: doc.workflowStatus,
      seoReady: doc.readiness.seoReady,
      updatedAt: toIso(doc.updatedAt),
      slug: doc.slug,
    }));

    const projectCaseStudyCount = projects.filter((project) => project.synopsis?.caseStudy).length;
    const draftCaseStudies = caseStudyDocs.filter((doc) => doc.workflowStatus === "draft").length;
    const publishedCaseStudiesFromStudio = caseStudyDocs.filter(
      (doc) => doc.workflowStatus === "published" || doc.visibility === "public_visible",
    ).length;
    const publishedCaseStudies = Math.max(publishedCaseStudiesFromStudio, projectCaseStudyCount);

    const readinessSource = caseStudyDocs.length > 0 ? caseStudyDocs : publishingCandidates;
    const readinessTotal = readinessSource.length;
    const readinessScore =
      readinessTotal > 0
        ? Math.round(
            readinessSource.reduce((sum, doc) => sum + doc.readiness.completionScore, 0) /
              readinessTotal,
          )
        : 0;

    const contentIssueCounts = {
      missingHeadline: 0,
      missingResults: 0,
      missingVisuals: 0,
      missingCta: 0,
      missingSeo: 0,
    };
    for (const doc of readinessSource) {
      if (!doc.readiness.checks.hasHeadline) contentIssueCounts.missingHeadline += 1;
      if (!doc.readiness.checks.hasResults) contentIssueCounts.missingResults += 1;
      if (!doc.readiness.checks.hasVisuals) contentIssueCounts.missingVisuals += 1;
      if (!doc.readiness.checks.hasCta) contentIssueCounts.missingCta += 1;
      if (!doc.readiness.checks.hasSeo) contentIssueCounts.missingSeo += 1;
    }

    const contentMissingKeyElements = readinessSource.filter(
      (doc) => doc.readiness.missingElements.length > 0,
    ).length;
    const itemsReadyToPublish = readinessSource.filter(
      (doc) =>
        doc.workflowStatus !== "published" &&
        doc.readiness.completionScore >= 80 &&
        (doc.workflowStatus === "staged" ||
          doc.workflowStatus === "scheduled" ||
          doc.workflowStatus === "draft"),
    ).length;

    const leadPriority = (lead: (typeof leadRows)[number]): number => {
      const score = lead.leadScore ?? 0;
      const valueWeight =
        lead.estimatedValue != null ? Math.min(45, Math.round(lead.estimatedValue / 200_000)) : 0;
      const intentBonus =
        lead.intentLevel === "hot_lead"
          ? 25
          : lead.intentLevel === "high_intent"
            ? 18
            : lead.intentLevel === "moderate_intent"
              ? 10
              : 0;
      return score + valueWeight + intentBonus;
    };

    const leads = [...leadRows]
      .sort((a, b) => leadPriority(b) - leadPriority(a))
      .slice(0, 10)
      .map((lead) => {
        const customFields = isRecord(lead.customFields) ? lead.customFields : {};
        const diagnosisReportId =
          typeof customFields.growthDiagnosisReportId === "number"
            ? customFields.growthDiagnosisReportId
            : null;
        const intakeSource =
          getString(lead.source) ??
          (typeof customFields.intakeSource === "string" ? customFields.intakeSource : null) ??
          "unknown";

        return {
          contactId: lead.id,
          leadName: lead.name,
          business: getString(lead.company) ?? "Unknown business",
          source: intakeSource,
          opportunity:
            lead.estimatedValue != null
              ? `$${Math.round(lead.estimatedValue / 100).toLocaleString()} est.`
              : lead.leadScore != null
                ? `Lead score ${lead.leadScore}`
                : "Opportunity under review",
          status: getString(lead.status) ?? "new",
          diagnosticHref: diagnosisReportId
            ? `/api/admin/growth-diagnosis/reports/${diagnosisReportId}`
            : intakeSource.includes("diagnosis")
              ? "/admin/lead-intake?tab=growth_diagnosis"
              : intakeSource.includes("funnel")
                ? "/admin/lead-intake?tab=funnel_lead"
                : "/admin/lead-intake",
        };
      });

    const clientGuaranteeMap = new Map<number, Awaited<ReturnType<typeof buildGuaranteeSnapshotForClient>>>();
    for (const lead of leads) {
      if (lead.contactId <= 0 || clientGuaranteeMap.has(lead.contactId)) continue;
      try {
        const snapshot = await buildGuaranteeSnapshotForClient(lead.contactId, 30);
        clientGuaranteeMap.set(lead.contactId, snapshot);
      } catch {
        // Keep operations dashboard resilient even if guarantee snapshot fails for one client.
      }
    }

    const guaranteeSummary = {
      actionRequiredCount: 0,
      inProgressCount: 0,
      metCount: 0,
    };
    const guaranteeAlerts = Array.from(clientGuaranteeMap.entries())
      .map(([clientId, snap]) => {
        if (snap.dashboardStatus === "action_required") guaranteeSummary.actionRequiredCount += 1;
        else if (snap.dashboardStatus === "in_progress") guaranteeSummary.inProgressCount += 1;
        else guaranteeSummary.metCount += 1;
        return {
          clientId,
          clientLabel:
            leads.find((lead) => lead.contactId === clientId)?.leadName ||
            leads.find((lead) => lead.contactId === clientId)?.business ||
            `Client #${clientId}`,
          dashboardStatus: snap.dashboardStatus,
          dashboardColor: snap.dashboardColor,
          qualifiedLeadsCount: snap.qualifiedLeadsCount,
          bookedJobsCount: snap.bookedJobsCount,
          conversionRate: snap.conversionRate,
          roiPercentage: snap.roiPercentage,
          compliance: snap.compliance,
          suggestedActions: Array.from(
            new Set(
              snap.rows
                .filter((row) => row.status === "not_met")
                .map((row) => {
                  if (row.type === "lead_flow") return "increase_traffic";
                  if (row.type === "booked_jobs") return "fix_conversion_flow";
                  if (row.type === "conversion") return "optimize_funnel";
                  return "adjust_offer";
                }),
            ),
          ).slice(0, 3),
        };
      })
      .sort((a, b) => {
        const score = (s: string) => (s === "action_required" ? 3 : s === "in_progress" ? 2 : 1);
        return score(b.dashboardStatus) - score(a.dashboardStatus);
      })
      .slice(0, 8);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      summary: {
        newDiagnosticsToReview,
        qualifiedLeads: Number(qualifiedLeadCountRows[0]?.count ?? 0),
        draftCaseStudies,
        publishedCaseStudies,
        contentMissingKeyElements,
        itemsReadyToPublish,
        guaranteeNotMet: guaranteeSummary.actionRequiredCount,
        guaranteeAtRisk: guaranteeSummary.inProgressCount,
        guaranteePerforming: guaranteeSummary.metCount,
      },
      diagnostics,
      caseStudies: caseStudyPipelineRows,
      publishingQueue,
      leads,
      guaranteeSummary,
      guaranteeAlerts,
      contentHealth: {
        averageCompletionScore: readinessScore,
        issues: [
          { label: "Missing headline", count: contentIssueCounts.missingHeadline },
          { label: "Missing results", count: contentIssueCounts.missingResults },
          { label: "Missing visuals", count: contentIssueCounts.missingVisuals },
          { label: "Missing CTA", count: contentIssueCounts.missingCta },
          { label: "Missing SEO", count: contentIssueCounts.missingSeo },
        ],
      },
    });
  } catch (error) {
    console.error("GET /api/admin/operations-dashboard failed:", error);
    return NextResponse.json(
      { message: "Failed to load operations dashboard" },
      { status: 500 },
    );
  }
}
