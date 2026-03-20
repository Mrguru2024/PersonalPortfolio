import { db } from "@server/db";
import { internalAutomationRuns, internalCmsDocuments, crmContacts } from "@shared/schema";
import { eq, desc, lt, and, isNotNull, isNull, or, notInArray } from "drizzle-orm";
import { runContentInsightAnalysis } from "./contentInsightService";
import { runResearchDiscovery, editorialGapDetection } from "./researchIntelligenceService";
import { executeAuditRun } from "@server/services/internalStudio/auditService";
import { getGrowthIntelligenceMode } from "./growthIntelligenceConfig";

export async function createAutomationRun(input: {
  jobType: string;
  payloadJson?: Record<string, unknown>;
  relatedDocumentId?: number | null;
  relatedCalendarEntryId?: number | null;
  triggeredByUserId: number | null;
}) {
  const [row] = await db
    .insert(internalAutomationRuns)
    .values({
      jobType: input.jobType,
      status: "running",
      payloadJson: input.payloadJson ?? {},
      relatedDocumentId: input.relatedDocumentId ?? null,
      relatedCalendarEntryId: input.relatedCalendarEntryId ?? null,
      triggeredByUserId: input.triggeredByUserId,
      startedAt: new Date(),
    })
    .returning();
  return row ?? null;
}

async function completeRun(
  id: number,
  patch: { status: "completed" | "failed"; resultSummary?: string; errorMessage?: string | null },
) {
  await db
    .update(internalAutomationRuns)
    .set({
      status: patch.status,
      resultSummary: patch.resultSummary ?? null,
      errorMessage: patch.errorMessage ?? null,
      completedAt: new Date(),
    })
    .where(eq(internalAutomationRuns.id, id));
}

export async function runAutomationJob(
  jobType: string,
  ctx: {
    projectKey: string;
    documentId?: number;
    calendarEntryId?: number;
    userId: number | null;
    payload?: Record<string, unknown>;
  },
): Promise<{ automationRunId: number; ok: boolean; message: string }> {
  const base = await createAutomationRun({
    jobType,
    payloadJson: { projectKey: ctx.projectKey, ...ctx.payload },
    relatedDocumentId: ctx.documentId ?? null,
    relatedCalendarEntryId: ctx.calendarEntryId ?? null,
    triggeredByUserId: ctx.userId,
  });
  if (!base) return { automationRunId: -1, ok: false, message: "Failed to create run" };
  const id = base.id;

  try {
    switch (jobType) {
      case "content_insight_save":
      case "content_insight_schedule": {
        if (!ctx.documentId) throw new Error("documentId required");
        const { runId, providerMode } = await runContentInsightAnalysis({
          documentId: ctx.documentId,
          triggerType: jobType === "content_insight_schedule" ? "on_schedule" : "on_save",
          triggeredByUserId: ctx.userId,
          calendarEntryId: ctx.calendarEntryId ?? null,
        });
        await completeRun(id, {
          status: "completed",
          resultSummary: `Insight run ${runId} (${providerMode})`,
        });
        return { automationRunId: id, ok: true, message: `Insight run ${runId}` };
      }
      case "audit_recommendation_engine": {
        const out = await executeAuditRun({
          projectKey: ctx.projectKey,
          label: (ctx.payload?.label as string) ?? `Automation audit ${new Date().toISOString()}`,
          triggeredByUserId: ctx.userId,
        });
        const rid = out?.run.id ?? "?";
        await completeRun(id, {
          status: "completed",
          resultSummary: `Audit run ${rid} completed`,
        });
        return { automationRunId: id, ok: true, message: `Audit ${rid}` };
      }
      case "weekly_research_digest": {
        const seed =
          (ctx.payload?.seed as string) ||
          `Weekly opportunities ${ctx.projectKey} ${new Date().toISOString().slice(0, 10)}`;
        const res = await runResearchDiscovery({
          projectKey: ctx.projectKey,
          seed,
          label: "Weekly opportunity digest",
          createdByUserId: ctx.userId,
        });
        await completeRun(id, {
          status: "completed",
          resultSummary: `Batch ${res.batchId}, ${res.itemCount} items (${res.providerMode})`,
        });
        return { automationRunId: id, ok: true, message: res.providerLabel };
      }
      case "editorial_gap_detection": {
        const gaps = await editorialGapDetection(ctx.projectKey);
        await completeRun(id, {
          status: "completed",
          resultSummary: JSON.stringify(gaps.suggestedGapDates),
        });
        return { automationRunId: id, ok: true, message: `${gaps.suggestedGapDates.length} gap hints` };
      }
      case "stale_content_detection": {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 21);
        const stale = await db
          .select({ id: internalCmsDocuments.id, title: internalCmsDocuments.title })
          .from(internalCmsDocuments)
          .where(
            and(
              eq(internalCmsDocuments.projectKey, ctx.projectKey),
              eq(internalCmsDocuments.workflowStatus, "draft"),
              lt(internalCmsDocuments.updatedAt, cutoff),
            ),
          )
          .limit(50);
        await completeRun(id, {
          status: "completed",
          resultSummary: `${stale.length} stale drafts`,
        });
        return { automationRunId: id, ok: true, message: `${stale.length} stale drafts` };
      }
      case "headline_hook_variants": {
        if (!ctx.documentId) throw new Error("documentId required");
        await runContentInsightAnalysis({
          documentId: ctx.documentId,
          triggerType: "automation",
          triggeredByUserId: ctx.userId,
        });
        await completeRun(id, {
          status: "completed",
          resultSummary: "Content insight run generated headline/hook suggestions",
        });
        return { automationRunId: id, ok: true, message: "Insights generated" };
      }
      case "repurposing_suggestions": {
        if (!ctx.documentId) throw new Error("documentId required");
        await runContentInsightAnalysis({
          documentId: ctx.documentId,
          triggerType: "automation",
          triggeredByUserId: ctx.userId,
        });
        await completeRun(id, {
          status: "completed",
          resultSummary:
            "AI insight run (repurpose/platform variants) — review suggestions in Content Studio document",
        });
        return { automationRunId: id, ok: true, message: "Repurposing suggestions generated" };
      }
      case "stale_followup_detection": {
        const now = new Date();
        const overdue = await db
          .select({ id: crmContacts.id })
          .from(crmContacts)
          .where(
            and(
              isNotNull(crmContacts.nextFollowUpAt),
              lt(crmContacts.nextFollowUpAt, now),
              or(isNull(crmContacts.status), notInArray(crmContacts.status, ["won", "lost"])),
            ),
          )
          .limit(500);
        await completeRun(id, {
          status: "completed",
          resultSummary: `${overdue.length} CRM contacts with overdue nextFollowUpAt`,
        });
        return {
          automationRunId: id,
          ok: true,
          message: `${overdue.length} stale follow-ups`,
        };
      }
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    await completeRun(id, { status: "failed", errorMessage: msg });
    return { automationRunId: id, ok: false, message: msg };
  }
}

/**
 * Scheduled jobs for cron: stale content, editorial gaps daily; weekly research digest on Mondays (UTC).
 */
export async function runScheduledGrowthOsJobs(input: {
  projectKey: string;
  triggeredByUserId: number | null;
}): Promise<{ steps: Array<{ job: string; ok: boolean; message: string }> }> {
  const steps: Array<{ job: string; ok: boolean; message: string }> = [];
  for (const job of ["stale_content_detection", "editorial_gap_detection", "stale_followup_detection"] as const) {
    const r = await runAutomationJob(job, {
      projectKey: input.projectKey,
      userId: input.triggeredByUserId,
    });
    steps.push({ job, ok: r.ok, message: r.message });
  }
  const isMondayUtc = new Date().getUTCDay() === 1;
  if (isMondayUtc) {
    const r = await runAutomationJob("weekly_research_digest", {
      projectKey: input.projectKey,
      userId: input.triggeredByUserId,
    });
    steps.push({ job: "weekly_research_digest", ok: r.ok, message: r.message });
  }
  return { steps };
}

export async function listAutomationRuns(limit = 40) {
  return db
    .select()
    .from(internalAutomationRuns)
    .orderBy(desc(internalAutomationRuns.startedAt))
    .limit(Math.min(limit, 200));
}

/** Fire-and-forget safe wrapper for API routes (log errors). */
export function triggerContentInsightAsync(input: {
  documentId: number;
  trigger: "on_save" | "on_schedule";
  userId: number | null;
  calendarEntryId?: number | null;
}): void {
  void runContentInsightAnalysis({
    documentId: input.documentId,
    triggerType: input.trigger,
    triggeredByUserId: input.userId,
    calendarEntryId: input.calendarEntryId ?? null,
  }).catch((err) => {
    console.error("[triggerContentInsightAsync]", err);
  });
}

export function getAutomationEnvironmentLabel(): string {
  return getGrowthIntelligenceMode();
}
