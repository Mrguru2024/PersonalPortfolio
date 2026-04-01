import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import {
  getCalendarEntry,
  updateCalendarEntry,
  syncDocumentWorkflowFromCalendar,
} from "@server/services/internalStudio/calendarService";
import { editorialStrategyMetaSchema, sanitizeEditorialStrategyMetaForDb } from "@shared/editorialStrategyMeta";
import { shouldAutoRunContentInsightOnSchedule } from "@server/services/growthIntelligence/growthIntelligenceConfig";
import { triggerContentInsightAsync } from "@server/services/growthIntelligence/automationService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    scheduledAt: z.string().optional(),
    endAt: z.string().nullable().optional(),
    timezone: z.string().optional(),
    calendarStatus: z.string().optional(),
    platformTargets: z.array(z.string()).optional(),
    personaTags: z.array(z.string()).optional(),
    ctaObjective: z.string().nullable().optional(),
    funnelStage: z.string().nullable().optional(),
    campaignId: z.number().int().nullable().optional(),
    documentId: z.number().int().nullable().optional(),
    strategyMeta: z.unknown().optional().nullable(),
  });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const eid = parseInt(id, 10);
    if (Number.isNaN(eid)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const entry = await getCalendarEntry(eid);
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ entry });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const eid = parseInt(id, 10);
    if (Number.isNaN(eid)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
    }
    const patch: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.strategyMeta !== undefined) {
      if (parsed.data.strategyMeta === null) {
        patch.strategyMeta = null;
      } else {
        const metaParsed = editorialStrategyMetaSchema.safeParse(parsed.data.strategyMeta);
        if (!metaParsed.success) {
          return NextResponse.json(
            { error: "Validation", details: metaParsed.error.flatten() },
            { status: 400 },
          );
        }
        patch.strategyMeta = sanitizeEditorialStrategyMetaForDb(metaParsed.data);
      }
    }
    if (parsed.data.scheduledAt) {
      const d = new Date(parsed.data.scheduledAt);
      if (Number.isNaN(d.getTime())) return NextResponse.json({ error: "Invalid scheduledAt" }, { status: 400 });
      patch.scheduledAt = d;
    }
    if (parsed.data.endAt !== undefined) {
      patch.endAt =
        parsed.data.endAt == null || parsed.data.endAt === ""
          ? null
          : new Date(parsed.data.endAt);
      if (patch.endAt && Number.isNaN((patch.endAt as Date).getTime())) {
        return NextResponse.json({ error: "Invalid endAt" }, { status: 400 });
      }
    }
    const row = await updateCalendarEntry(eid, patch as never);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (row.documentId && row.calendarStatus) {
      await syncDocumentWorkflowFromCalendar(row.documentId, row.calendarStatus);
    }
    if (
      row.documentId &&
      row.calendarStatus === "scheduled" &&
      parsed.data.calendarStatus === "scheduled" &&
      shouldAutoRunContentInsightOnSchedule()
    ) {
      triggerContentInsightAsync({
        documentId: row.documentId,
        trigger: "on_schedule",
        userId: null,
        calendarEntryId: eid,
      });
    }
    return NextResponse.json({ entry: row });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
