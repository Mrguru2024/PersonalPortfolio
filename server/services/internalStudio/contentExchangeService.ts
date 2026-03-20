/**
 * Import / export editorial content and calendar rows (CSV, JSON, iCal).
 * Google Calendar "secret address" iCal URLs and published Google Sheet CSV URLs are fetched via import-url API with host allowlist.
 */
import { db } from "@server/db";
import { internalEditorialCalendarEntries, internalCmsDocuments } from "@shared/schema";
import { eq, and, gte, lte, asc, desc } from "drizzle-orm";
import { createCalendarEntry } from "./calendarService";
import { createDocument } from "./cmsService";

export interface ParsedCalendarRow {
  title: string;
  scheduledAt: Date;
  timezone?: string;
  calendarStatus?: string;
  platformTargets?: string[];
  ctaObjective?: string | null;
  funnelStage?: string | null;
  campaignId?: number | null;
  documentId?: number | null;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

/** Unfold iCal lines (RFC 5545 continuation). */
function unfoldIcal(text: string): string {
  return text.replace(/\r\n[ \t]/g, "");
}

export function parseIcalVevents(icalText: string): Array<{ summary: string; start: Date; end?: Date }> {
  const text = unfoldIcal(icalText.replace(/\r\n/g, "\n"));
  const events: Array<{ summary: string; start: Date; end?: Date }> = [];
  const blocks = text.split(/BEGIN:VEVENT/gi).slice(1);
  for (const raw of blocks) {
    const endIdx = raw.search(/END:VEVENT/i);
    const block = endIdx >= 0 ? raw.slice(0, endIdx) : raw;
    const summaryMatch = block.match(/^SUMMARY(?:;[^:]+)*:(.+)$/im);
    const summary = summaryMatch?.[1]?.trim().replace(/\\n/g, "\n").replace(/\\,/g, ",") ?? "Imported event";
    const dtStartLine = block.match(/^DTSTART([^:]*):([^\r\n]+)/im);
    const dtEndLine = block.match(/^DTEND([^:]*):([^\r\n]+)/im);
    if (!dtStartLine) continue;
    const params = dtStartLine[1] ?? "";
    const value = dtStartLine[2].trim();
    let start: Date;
    if (params.includes("VALUE=DATE") && /^\d{8}$/.test(value)) {
      const y = parseInt(value.slice(0, 4), 10);
      const m = parseInt(value.slice(4, 6), 10) - 1;
      const d = parseInt(value.slice(6, 8), 10);
      start = new Date(Date.UTC(y, m, d, 12, 0, 0));
    } else {
      const normalized = value.replace(/^(\d{4})(\d{2})(\d{2})T/, "$1-$2-$3T").replace(/Z$/, "Z");
      start = new Date(normalized);
      if (Number.isNaN(start.getTime())) continue;
    }
    let end: Date | undefined;
    if (dtEndLine) {
      const v2 = dtEndLine[2].trim();
      const p2 = dtEndLine[1] ?? "";
      if (p2.includes("VALUE=DATE") && /^\d{8}$/.test(v2)) {
        const y = parseInt(v2.slice(0, 4), 10);
        const m = parseInt(v2.slice(4, 6), 10) - 1;
        const d = parseInt(v2.slice(6, 8), 10);
        end = new Date(Date.UTC(y, m, d, 12, 0, 0));
      } else {
        const n2 = v2.replace(/^(\d{4})(\d{2})(\d{2})T/, "$1-$2-$3T").replace(/Z$/, "Z");
        const e = new Date(n2);
        if (!Number.isNaN(e.getTime())) end = e;
      }
    }
    events.push({ summary, start, end });
  }
  return events;
}

/** Minimal CSV parser with quoted fields. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(cur);
        cur = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else {
        cur += c;
      }
    }
  }
  row.push(cur);
  if (row.some((c) => c.length > 0)) rows.push(row);
  return rows;
}

function normHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function calendarRowsFromCsv(text: string): ParsedCalendarRow[] {
  const table = parseCsv(text.trim());
  if (table.length < 2) return [];
  const headers = table[0].map(normHeader);
  const idx = (name: string) => headers.indexOf(name);
  const iTitle = idx("title") >= 0 ? idx("title") : idx("summary");
  const iStart = idx("scheduled_at") >= 0 ? idx("scheduled_at") : idx("start") >= 0 ? idx("start") : idx("datetime");
  if (iTitle < 0 || iStart < 0) return [];
  const out: ParsedCalendarRow[] = [];
  for (let r = 1; r < table.length; r++) {
    const row = table[r];
    if (!row[iTitle]?.trim()) continue;
    const d = new Date(row[iStart]?.trim() ?? "");
    if (Number.isNaN(d.getTime())) continue;
    const tz = idx("timezone") >= 0 ? row[idx("timezone")]?.trim() || "UTC" : "UTC";
    const plat = idx("platform_targets") >= 0 ? row[idx("platform_targets")]?.trim() : "";
    const platforms = plat
      ? plat
          .split(/[|;]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    out.push({
      title: row[iTitle].trim(),
      scheduledAt: d,
      timezone: tz,
      calendarStatus: idx("calendar_status") >= 0 ? row[idx("calendar_status")]?.trim() || "draft" : "draft",
      platformTargets: platforms,
      ctaObjective: idx("cta_objective") >= 0 ? row[idx("cta_objective")]?.trim() || null : null,
      funnelStage: idx("funnel_stage") >= 0 ? row[idx("funnel_stage")]?.trim() || null : null,
      campaignId:
        idx("campaign_id") >= 0 ? parseInt(row[idx("campaign_id")] ?? "", 10) || null : null,
      documentId:
        idx("document_id") >= 0 ? parseInt(row[idx("document_id")] ?? "", 10) || null : null,
    });
  }
  return out;
}

export async function importCalendarRows(
  projectKey: string,
  rows: ParsedCalendarRow[],
): Promise<ImportResult> {
  const errors: string[] = [];
  let created = 0;
  let skipped = 0;
  for (const row of rows) {
    try {
      await createCalendarEntry({
        projectKey,
        title: row.title,
        scheduledAt: row.scheduledAt,
        timezone: row.timezone ?? "UTC",
        calendarStatus: row.calendarStatus ?? "draft",
        platformTargets: row.platformTargets ?? [],
        personaTags: [],
        ctaObjective: row.ctaObjective ?? null,
        funnelStage: row.funnelStage ?? null,
        campaignId: row.campaignId ?? null,
        documentId: row.documentId ?? null,
        sortOrder: 0,
      });
      created++;
    } catch (e) {
      skipped++;
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  return { created, skipped, errors: errors.slice(0, 20) };
}

export interface DocumentImportRow {
  title: string;
  contentType: string;
  bodyHtml?: string;
  excerpt?: string | null;
  workflowStatus?: string;
  visibility?: string;
}

export async function importDocuments(
  projectKey: string,
  rows: DocumentImportRow[],
): Promise<ImportResult> {
  const errors: string[] = [];
  let created = 0;
  let skipped = 0;
  for (const row of rows) {
    if (!row.title?.trim()) {
      skipped++;
      continue;
    }
    try {
      await createDocument({
        projectKey,
        title: row.title.trim(),
        contentType: row.contentType || "blog_draft",
        bodyHtml: row.bodyHtml ?? "<p></p>",
        excerpt: row.excerpt ?? null,
        workflowStatus: row.workflowStatus ?? "draft",
        visibility: row.visibility ?? "internal_only",
      });
      created++;
    } catch (e) {
      skipped++;
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  return { created, skipped, errors: errors.slice(0, 20) };
}

export async function exportCalendarCsv(projectKey: string, from?: Date, to?: Date): Promise<string> {
  const conditions = [eq(internalEditorialCalendarEntries.projectKey, projectKey)];
  if (from) conditions.push(gte(internalEditorialCalendarEntries.scheduledAt, from));
  if (to) conditions.push(lte(internalEditorialCalendarEntries.scheduledAt, to));
  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
  const rows = await db
    .select()
    .from(internalEditorialCalendarEntries)
    .where(whereClause)
    .orderBy(asc(internalEditorialCalendarEntries.scheduledAt));

  const header =
    "title,scheduled_at,timezone,calendar_status,platform_targets,cta_objective,funnel_stage,campaign_id,document_id";
  const lines = [header];
  for (const r of rows) {
    const plat = ((r.platformTargets as string[]) ?? []).join("|");
    const esc = (s: string | null | undefined) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    lines.push(
      [
        esc(r.title),
        esc(r.scheduledAt?.toISOString() ?? ""),
        esc(r.timezone),
        esc(r.calendarStatus),
        esc(plat),
        esc(r.ctaObjective),
        esc(r.funnelStage),
        r.campaignId ?? "",
        r.documentId ?? "",
      ].join(","),
    );
  }
  return lines.join("\n");
}

export async function exportCalendarJson(projectKey: string, from?: Date, to?: Date) {
  const conditions = [eq(internalEditorialCalendarEntries.projectKey, projectKey)];
  if (from) conditions.push(gte(internalEditorialCalendarEntries.scheduledAt, from));
  if (to) conditions.push(lte(internalEditorialCalendarEntries.scheduledAt, to));
  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
  return db
    .select()
    .from(internalEditorialCalendarEntries)
    .where(whereClause)
    .orderBy(asc(internalEditorialCalendarEntries.scheduledAt));
}

export async function exportDocumentsCsv(projectKey: string): Promise<string> {
  const rows = await db
    .select()
    .from(internalCmsDocuments)
    .where(eq(internalCmsDocuments.projectKey, projectKey))
    .orderBy(desc(internalCmsDocuments.updatedAt))
    .limit(500);

  const header = "title,content_type,workflow_status,visibility,excerpt,body_html";
  const lines = [header];
  for (const r of rows) {
    const esc = (s: string | null | undefined) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    lines.push(
      [
        esc(r.title),
        esc(r.contentType),
        esc(r.workflowStatus),
        esc(r.visibility),
        esc(r.excerpt),
        esc(r.bodyHtml),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export function documentsFromCsv(text: string): DocumentImportRow[] {
  const table = parseCsv(text.trim());
  if (table.length < 2) return [];
  const headers = table[0].map(normHeader);
  const idx = (name: string) => headers.indexOf(name);
  const iTitle = idx("title");
  const iType = idx("content_type") >= 0 ? idx("content_type") : idx("contenttype");
  const iBody = idx("body_html") >= 0 ? idx("body_html") : idx("bodyhtml");
  if (iTitle < 0) return [];
  const out: DocumentImportRow[] = [];
  for (let r = 1; r < table.length; r++) {
    const row = table[r];
    if (!row[iTitle]?.trim()) continue;
    out.push({
      title: row[iTitle].trim(),
      contentType: iType >= 0 ? row[iType]?.trim() || "blog_draft" : "blog_draft",
      bodyHtml: iBody >= 0 ? row[iBody]?.trim() || "<p></p>" : "<p></p>",
      excerpt: idx("excerpt") >= 0 ? row[idx("excerpt")]?.trim() || null : null,
      workflowStatus: idx("workflow_status") >= 0 ? row[idx("workflow_status")]?.trim() || "draft" : "draft",
      visibility: idx("visibility") >= 0 ? row[idx("visibility")]?.trim() || "internal_only" : "internal_only",
    });
  }
  return out;
}

export function documentsFromJson(data: unknown): DocumentImportRow[] {
  if (!Array.isArray(data)) return [];
  return data.map((item) => {
    const o = item as Record<string, unknown>;
    return {
      title: String(o.title ?? ""),
      contentType: String(o.contentType ?? o.content_type ?? "blog_draft"),
      bodyHtml: typeof o.bodyHtml === "string" ? o.bodyHtml : typeof o.body_html === "string" ? o.body_html : "<p></p>",
      excerpt: o.excerpt != null ? String(o.excerpt) : null,
      workflowStatus: typeof o.workflowStatus === "string" ? o.workflowStatus : "draft",
      visibility: typeof o.visibility === "string" ? o.visibility : "internal_only",
    };
  });
}

/** SSRF-safe: only Google Sheets (published CSV) and Google Calendar iCal feeds. */
export function isAllowedContentImportUrl(urlString: string): boolean {
  try {
    const u = new URL(urlString);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (host === "docs.google.com" && u.pathname.includes("/spreadsheets/")) return true;
    if (host === "calendar.google.com" && u.pathname.includes("/calendar/ical/")) return true;
    if (host === "www.google.com" && u.pathname.includes("/calendar/ical/")) return true;
    return false;
  } catch {
    return false;
  }
}

export async function fetchTextFromAllowedUrl(urlString: string): Promise<string> {
  if (!isAllowedContentImportUrl(urlString)) {
    throw new Error("URL host not allowed (use Google Sheets export or Calendar iCal address)");
  }
  const res = await fetch(urlString, {
    redirect: "follow",
    headers: { "User-Agent": "AscendraContentStudio/1.0" },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.text();
}
