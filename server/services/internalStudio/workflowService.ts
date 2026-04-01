import { db } from "@server/db";
import { listFacebookAccountSummaries } from "@server/services/contentStudioFacebookConnectService";
import { listLinkedInAccountSummaries } from "@server/services/contentStudioLinkedInConnectService";
import { listThreadsAccountSummaries } from "@server/services/contentStudioThreadsConnectService";
import { listXAccountSummaries } from "@server/services/contentStudioXConnectService";
import {
  internalPublishLogs,
  internalPlatformAdapters,
  internalCmsDocuments,
  internalEditorialCalendarEntries,
  type InternalPlatformAdapter,
} from "@shared/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import {
  getCalendarEntry,
  syncDocumentWorkflowFromCalendar,
  listCalendarEntriesDueForPublish,
} from "./calendarService";
import { htmlToPlainText, publishViaAdapter } from "./publishAdapters";
import type { InternalCmsDocument } from "@shared/schema";

const DEFAULT_ADAPTERS = [
  { key: "manual", displayName: "Manual publish (log only)", config: {} },
  { key: "facebook_page", displayName: "Facebook Page (Graph API)", config: {} },
  { key: "linkedin", displayName: "LinkedIn (UGC API — OAuth token)", config: {} },
  { key: "x", displayName: "X / Twitter (API v2 — OAuth2 user token)", config: {} },
  { key: "threads", displayName: "Threads (Meta Threads API — text posts)", config: {} },
  { key: "webhook_hub", displayName: "Webhook hub (Buffer / Make / Zapier URL)", config: {} },
  { key: "brevo_notify", displayName: "Brevo email notify-only", config: {} },
  { key: "blog", displayName: "Ascendra blog (future)", config: { route: "/api/admin/blog" } },
  { key: "newsletter", displayName: "Newsletter send (future)", config: { route: "/api/admin/newsletters" } },
  { key: "social_placeholder", displayName: "Social API (legacy placeholder)", config: {} },
] as const;

export async function ensureDefaultPlatformAdapters() {
  const existing = await db.select({ key: internalPlatformAdapters.key }).from(internalPlatformAdapters);
  const have = new Set(existing.map((r) => r.key));
  const missing = DEFAULT_ADAPTERS.filter((a) => !have.has(a.key));
  if (missing.length === 0) return;
  await db.insert(internalPlatformAdapters).values(
    missing.map((a) => ({
      key: a.key,
      displayName: a.displayName,
      config: { ...a.config },
      active: true,
    })),
  );
}

export async function listPlatformAdapters() {
  await ensureDefaultPlatformAdapters();
  return db.select().from(internalPlatformAdapters).orderBy(asc(internalPlatformAdapters.displayName));
}

function expandOAuthTargets(
  out: InternalPlatformAdapter[],
  r: InternalPlatformAdapter,
  baseKey: string,
  shortLabel: string,
  summaries: { accountId: string; label: string; keyPrefix?: string }[],
  hasEnvFallback: boolean,
): void {
  if (summaries.length === 0) {
    if (hasEnvFallback) out.push(r);
    return;
  }
  if (summaries.length === 1) {
    out.push({
      ...r,
      displayName: `${shortLabel} — ${summaries[0].label}`,
    });
    return;
  }
  const sorted = [...summaries].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
  for (const acc of sorted) {
    const prefix = acc.keyPrefix ?? baseKey;
    out.push({
      ...r,
      key: `${prefix}:${acc.accountId}`,
      displayName: `${shortLabel} — ${acc.label}`,
      config: { ...(r.config as Record<string, unknown>), accountId: acc.accountId },
    });
  }
}

/**
 * Calendar UI: expands facebook_page, linkedin, x, threads when multiple OAuth accounts exist.
 */
export async function listPlatformAdaptersForCalendar() {
  await ensureDefaultPlatformAdapters();
  const rows = await db.select().from(internalPlatformAdapters).orderBy(asc(internalPlatformAdapters.displayName));

  const [fbSummaries, liSummaries, xSummaries, thSummaries] = await Promise.all([
    listFacebookAccountSummaries(),
    listLinkedInAccountSummaries(),
    listXAccountSummaries(),
    listThreadsAccountSummaries(),
  ]);

  const hasFbEnv =
    !!(process.env.FACEBOOK_ACCESS_TOKEN ?? process.env.META_ACCESS_TOKEN)?.trim() &&
    !!(process.env.FACEBOOK_PAGE_ID ?? process.env.META_PAGE_ID)?.trim();
  const hasLiEnv = !!(
    process.env.LINKEDIN_ACCESS_TOKEN?.trim() && process.env.LINKEDIN_AUTHOR_URN?.trim()
  );
  const hasXEnv = !!(
    process.env.X_OAUTH2_ACCESS_TOKEN?.trim() ||
    process.env.TWITTER_OAUTH2_ACCESS_TOKEN?.trim() ||
    process.env.TWITTER_ACCESS_TOKEN?.trim()
  );
  const hasThEnv = !!(
    (process.env.THREADS_ACCESS_TOKEN ?? process.env.META_THREADS_ACCESS_TOKEN)?.trim() &&
    (process.env.THREADS_USER_ID ?? process.env.META_THREADS_USER_ID)?.trim()
  );

  const out: InternalPlatformAdapter[] = [];
  for (const r of rows) {
    if (r.key === "facebook_page") {
      expandOAuthTargets(
        out,
        r,
        "facebook_page",
        "Facebook Page",
        fbSummaries.map((a) => ({ accountId: a.accountId, label: a.pageName })),
        hasFbEnv,
      );
      continue;
    }
    if (r.key === "linkedin") {
      expandOAuthTargets(
        out,
        r,
        "linkedin",
        "LinkedIn",
        liSummaries.map((a) => ({
          accountId: a.accountId,
          label: a.displayLabel,
          keyPrefix: a.accountKind === "organization" ? "linkedin_org" : undefined,
        })),
        hasLiEnv,
      );
      continue;
    }
    if (r.key === "x") {
      expandOAuthTargets(
        out,
        r,
        "x",
        "X",
        xSummaries.map((a) => ({ accountId: a.accountId, label: `@${a.username}` })),
        hasXEnv,
      );
      continue;
    }
    if (r.key === "threads") {
      expandOAuthTargets(
        out,
        r,
        "threads",
        "Threads",
        thSummaries.map((a) => ({ accountId: a.accountId, label: `@${a.username}` })),
        hasThEnv,
      );
      continue;
    }
    out.push(r);
  }
  return out;
}

/** Map calendar platform target (e.g. facebook_page:uuid) to internal_platform_adapters.key. */
export function calendarAdapterBaseKey(platformKey: string): string {
  const lower = platformKey.trim().toLowerCase();
  if (
    lower === "facebook_page" ||
    lower.startsWith("facebook_page:") ||
    lower === "facebook" ||
    lower.startsWith("facebook:")
  ) {
    return "facebook_page";
  }
  if (lower === "linkedin_member" || lower.startsWith("linkedin_member:")) {
    return "linkedin";
  }
  if (lower === "linkedin_org" || lower.startsWith("linkedin_org:")) {
    return "linkedin";
  }
  if (lower === "linkedin" || lower.startsWith("linkedin:")) {
    return "linkedin";
  }
  if (lower === "threads" || lower.startsWith("threads:")) {
    return "threads";
  }
  if (lower === "x" || lower.startsWith("x:") || lower === "twitter" || lower.startsWith("twitter:")) {
    return "x";
  }
  const t = platformKey.trim();
  const colon = t.indexOf(":");
  if (colon !== -1) return t.slice(0, colon);
  return t;
}

export async function appendPublishLog(data: typeof internalPublishLogs.$inferInsert) {
  const [row] = await db.insert(internalPublishLogs).values(data).returning();
  return row;
}

export async function listPublishLogs(filters: { documentId?: number; limit?: number }) {
  const lim = Math.min(filters.limit ?? 50, 200);
  if (filters.documentId != null) {
    return db
      .select()
      .from(internalPublishLogs)
      .where(eq(internalPublishLogs.documentId, filters.documentId))
      .orderBy(desc(internalPublishLogs.createdAt))
      .limit(lim);
  }
  return db
    .select()
    .from(internalPublishLogs)
    .orderBy(desc(internalPublishLogs.createdAt))
    .limit(lim);
}

/** When true (default), cron only publishes if linked document has approvalStatus === approved. */
export function contentStudioScheduledRequiresApproval(): boolean {
  const v = process.env.CONTENT_STUDIO_SCHEDULED_REQUIRE_APPROVAL?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no") return false;
  return true;
}

function buildIdempotencyKey(
  calendarEntryId: number | null,
  platform: string,
  scheduledAt: Date,
  documentId: number,
): string {
  const t = new Date(scheduledAt).toISOString().slice(0, 16);
  return calendarEntryId != null
    ? `cal:${calendarEntryId}:p:${platform}:t:${t}`
    : `doc:${documentId}:p:${platform}:manual:${Date.now()}`;
}

async function hasSuccessfulPublishWithIdempotencyKey(
  calendarEntryId: number | null,
  documentId: number,
  platform: string,
  idempotencyKey: string,
): Promise<boolean> {
  const rows = await db
    .select()
    .from(internalPublishLogs)
    .where(
      and(eq(internalPublishLogs.documentId, documentId), eq(internalPublishLogs.platform, platform)),
    )
    .orderBy(desc(internalPublishLogs.createdAt))
    .limit(40);
  for (const r of rows) {
    if (calendarEntryId != null && r.calendarEntryId !== calendarEntryId) continue;
    if (r.status !== "success") continue;
    const k = (r.requestPayload as { idempotencyKey?: string } | null)?.idempotencyKey;
    if (k === idempotencyKey) return true;
  }
  return false;
}

function canPublishDocument(
  doc: InternalCmsDocument,
  mode: "scheduled" | "manual",
  force?: boolean,
  /** Set after a prior scheduled gate check so per-platform calls do not re-skip. */
  skipScheduledApproval?: boolean,
): { ok: true } | { ok: false; reason: string } {
  if (force) return { ok: true };
  if (doc.approvalStatus === "rejected") return { ok: false, reason: "Document is rejected" };
  if (
    mode === "scheduled" &&
    !skipScheduledApproval &&
    contentStudioScheduledRequiresApproval() &&
    doc.approvalStatus !== "approved"
  ) {
    return {
      ok: false,
      reason:
        "Scheduled auto-publish requires approvalStatus=approved, or set CONTENT_STUDIO_SCHEDULED_REQUIRE_APPROVAL=0.",
    };
  }
  return { ok: true };
}

async function isAdapterActive(platformKey: string): Promise<boolean> {
  await ensureDefaultPlatformAdapters();
  const base = calendarAdapterBaseKey(platformKey);
  const [row] = await db
    .select()
    .from(internalPlatformAdapters)
    .where(eq(internalPlatformAdapters.key, base))
    .limit(1);
  return !!row?.active;
}

async function loadDocument(documentId: number) {
  const [doc] = await db
    .select()
    .from(internalCmsDocuments)
    .where(eq(internalCmsDocuments.id, documentId))
    .limit(1);
  return doc ?? null;
}

function buildPublishBody(doc: InternalCmsDocument, fallbackTitle: string) {
  const bodyText =
    htmlToPlainText(doc.bodyHtml ?? "").trim() ||
    (doc.bodyMarkdown ?? "").replace(/[#*_`]/g, " ").trim() ||
    "";
  const title = (doc.title || fallbackTitle).trim();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const link =
    doc.slug && baseUrl
      ? `${baseUrl}/blog/${doc.slug}`
      : baseUrl
        ? `${baseUrl}/admin/content-studio/documents/${doc.id}`
        : null;
  return { title, bodyText, link };
}

/**
 * Publish one platform for a document (manual button or single step).
 */
export async function publishDocumentToSinglePlatform(input: {
  documentId: number;
  calendarEntryId: number | null;
  platform: string;
  userId: number | null;
  mode: "scheduled" | "manual";
  force?: boolean;
  /** After publishCalendarEntryScheduled verified approval once. */
  skipScheduledApprovalCheck?: boolean;
  /** When set (e.g. cron), used for idempotency instead of now */
  scheduledAtForIdem?: Date;
}): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const doc = await loadDocument(input.documentId);
  if (!doc) return { ok: false, error: "Document not found" };

  const gate = canPublishDocument(doc, input.mode, input.force, input.skipScheduledApprovalCheck);
  if (!gate.ok) {
    await appendPublishLog({
      documentId: input.documentId,
      calendarEntryId: input.calendarEntryId,
      platform: input.platform,
      status: "skipped",
      requestPayload: { mode: input.mode, userId: input.userId, gate: true },
      responsePayload: { reason: gate.reason },
      errorMessage: gate.reason,
    });
    return { ok: false, error: gate.reason, skipped: true };
  }

  const entry = input.calendarEntryId != null ? await getCalendarEntry(input.calendarEntryId) : null;
  const scheduledAt = input.scheduledAtForIdem ?? (entry?.scheduledAt ? new Date(entry.scheduledAt) : new Date());
  const idem = buildIdempotencyKey(input.calendarEntryId, input.platform, scheduledAt, input.documentId);

  if (await hasSuccessfulPublishWithIdempotencyKey(input.calendarEntryId, input.documentId, input.platform, idem)) {
    return { ok: true, skipped: true };
  }

  const active = await isAdapterActive(input.platform);
  if (!active) {
    await appendPublishLog({
      documentId: input.documentId,
      calendarEntryId: input.calendarEntryId,
      platform: input.platform,
      status: "failed",
      requestPayload: { idempotencyKey: idem, mode: input.mode, userId: input.userId },
      responsePayload: { adapterInactive: true },
      errorMessage: "Platform adapter disabled or missing",
    });
    return { ok: false, error: "Adapter inactive in Content Studio settings" };
  }

  const { title, bodyText, link } = buildPublishBody(doc, entry?.title ?? doc.title);
  const out = await publishViaAdapter(input.platform, { title, bodyText, link });

  if (out.ok) {
    await appendPublishLog({
      documentId: input.documentId,
      calendarEntryId: input.calendarEntryId,
      platform: input.platform,
      status: "success",
      requestPayload: { idempotencyKey: idem, mode: input.mode, userId: input.userId },
      responsePayload: { externalId: out.externalId, raw: out.raw },
      errorMessage: null,
    });
    return { ok: true };
  }

  await appendPublishLog({
    documentId: input.documentId,
    calendarEntryId: input.calendarEntryId,
    platform: input.platform,
    status: "failed",
    requestPayload: { idempotencyKey: idem, mode: input.mode, userId: input.userId },
    responsePayload: {},
    errorMessage: out.error,
  });
  return { ok: false, error: out.error };
}

/**
 * Cron: all platform targets on a calendar entry. Marks published only if every target succeeds or idempotent skip.
 */
export async function publishCalendarEntryScheduled(calendarEntryId: number): Promise<{
  ok: boolean;
  results: { platform: string; ok: boolean; error?: string; skipped?: boolean }[];
}> {
  const entry = await getCalendarEntry(calendarEntryId);
  if (!entry?.documentId) {
    return { ok: false, results: [{ platform: "*", ok: false, error: "Missing entry or document" }] };
  }

  const doc = await loadDocument(entry.documentId);
  if (!doc) {
    return { ok: false, results: [{ platform: "*", ok: false, error: "Document not found" }] };
  }

  const preGate = canPublishDocument(doc, "scheduled", false, false);
  if (!preGate.ok) {
    await appendPublishLog({
      documentId: entry.documentId,
      calendarEntryId: entry.id,
      platform: "_approval",
      status: "skipped",
      requestPayload: { mode: "scheduled", gate: true },
      responsePayload: { reason: preGate.reason },
      errorMessage: preGate.reason,
    });
    return { ok: false, results: [{ platform: "_approval", ok: false, error: preGate.reason }] };
  }

  const platforms = (entry.platformTargets as string[])?.map((p) => p.trim()).filter(Boolean) ?? [];
  if (platforms.length === 0) {
    await appendPublishLog({
      documentId: entry.documentId,
      calendarEntryId: entry.id,
      platform: "_targets",
      status: "skipped",
      requestPayload: { mode: "scheduled" },
      responsePayload: { reason: "No platform targets on calendar entry" },
      errorMessage: "No platform targets",
    });
    return { ok: false, results: [{ platform: "_targets", ok: false, error: "No platform targets" }] };
  }

  const scheduledAt = new Date(entry.scheduledAt!);
  const results: { platform: string; ok: boolean; error?: string; skipped?: boolean }[] = [];
  let anyFail = false;

  for (const platform of platforms) {
    const r = await publishDocumentToSinglePlatform({
      documentId: entry.documentId,
      calendarEntryId: entry.id,
      platform,
      userId: null,
      mode: "scheduled",
      skipScheduledApprovalCheck: true,
      scheduledAtForIdem: scheduledAt,
    });
    results.push({
      platform,
      ok: r.ok,
      error: r.error,
      skipped: r.skipped,
    });
    if (!r.ok) anyFail = true;
  }

  if (!anyFail) {
    await db
      .update(internalEditorialCalendarEntries)
      .set({ calendarStatus: "published", updatedAt: new Date() })
      .where(eq(internalEditorialCalendarEntries.id, entry.id));
    await syncDocumentWorkflowFromCalendar(entry.documentId, "published");
    return { ok: true, results };
  }

  await db
    .update(internalEditorialCalendarEntries)
    .set({ calendarStatus: "failed", updatedAt: new Date() })
    .where(eq(internalEditorialCalendarEntries.id, entry.id));
  await syncDocumentWorkflowFromCalendar(entry.documentId, "failed");
  return { ok: false, results };
}

export async function manualPublishDocument(input: {
  documentId: number;
  calendarEntryId?: number | null;
  platform: string;
  userId: number | null;
  force?: boolean;
}) {
  const out = await publishDocumentToSinglePlatform({
    documentId: input.documentId,
    calendarEntryId: input.calendarEntryId ?? null,
    platform: input.platform,
    userId: input.userId,
    mode: "manual",
    force: input.force,
  });
  return { ok: out.ok, error: out.error, skipped: out.skipped };
}

export async function runScheduledContentStudioPublishes(opts: { projectKey: string }): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  entryIds: number[];
}> {
  const now = new Date();
  const due = await listCalendarEntriesDueForPublish({ projectKey: opts.projectKey, before: now });
  let succeeded = 0;
  let failed = 0;
  const entryIds: number[] = [];

  for (const row of due) {
    entryIds.push(row.id);
    const out = await publishCalendarEntryScheduled(row.id);
    if (out.ok) succeeded += 1;
    else failed += 1;
  }

  return { processed: due.length, succeeded, failed, entryIds };
}
