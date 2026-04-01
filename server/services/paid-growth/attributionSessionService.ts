/**
 * PPC Revenue Engine — attribution session first/last touch + heuristic campaign match.
 * Uses `ppc_attribution_sessions` alongside `visitor_activity` (no duplicate event stream).
 */
import { randomBytes } from "crypto";
import { db } from "@server/db";
import { ppcAttributionSessions, type PpcCampaign } from "@shared/paidGrowthSchema";
import { and, eq } from "drizzle-orm";
import type { IStorage } from "@server/storage";

export type TouchUtm = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
};

function normalizePath(p: string | null | undefined): string {
  if (!p || typeof p !== "string") return "";
  let x = p.trim();
  if (!x) return "";
  if (!x.startsWith("/")) x = `/${x}`;
  return x.split("?")[0].toLowerCase();
}

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function extractUtmFromMetadata(metadata: Record<string, unknown> | undefined): TouchUtm {
  if (!metadata || typeof metadata !== "object") return {};
  const g = (k: string) =>
    typeof metadata[k] === "string" ? (metadata[k] as string) : undefined;
  return {
    utm_source: g("utm_source"),
    utm_medium: g("utm_medium"),
    utm_campaign: g("utm_campaign"),
    utm_content: g("utm_content"),
    utm_term: g("utm_term"),
  };
}

/** Heuristic: match stored campaign tracking params and/or landing path. */
export function resolvePpcCampaignIdFromContext(
  campaigns: PpcCampaign[],
  utm: TouchUtm,
  landingPath: string | null,
): number | null {
  const uCamp = norm(utm.utm_campaign);
  const uSrc = norm(utm.utm_source);
  const uMed = norm(utm.utm_medium);
  const path = normalizePath(landingPath);

  let pathMatch: number | null = null;
  let utmMatch: number | null = null;

  for (const c of campaigns) {
    const t = (c.trackingParamsJson ?? {}) as Record<string, string | undefined>;
    const cCamp = norm(t.utm_campaign);
    const cSrc = norm(t.utm_source);
    const cMed = norm(t.utm_medium);
    const cPath = normalizePath(c.landingPagePath);

    if (path && cPath && (path === cPath || path.startsWith(cPath) || cPath.startsWith(path))) {
      pathMatch = pathMatch ?? c.id;
    }
    if (uCamp && cCamp && uCamp === cCamp) {
      const srcOk = !uSrc || !cSrc || uSrc === cSrc;
      const medOk = !uMed || !cMed || uMed === cMed;
      if (srcOk && medOk) utmMatch = c.id;
    }
  }

  return utmMatch ?? pathMatch;
}

function touchSnapshot(
  utm: TouchUtm,
  landingPath: string | null,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...utm,
    landing_page: landingPath ?? undefined,
    capturedAt: new Date().toISOString(),
    ...extra,
  };
}

export type TouchAttributionFromTrackInput = {
  visitorId: string;
  sessionId?: string | null;
  pageVisited?: string | null;
  metadata?: Record<string, unknown> | null;
  /** When known (e.g. form submit), link CRM contact to this session */
  crmContactId?: number | null;
};

export type TouchAttributionResult = {
  id: number;
  publicId: string;
  ppcCampaignId: number | null;
};

/**
 * Upsert session row, merge first/last touch, resolve PPC campaign when possible.
 */
export async function touchAttributionSessionFromTrackEvent(
  storage: IStorage,
  input: TouchAttributionFromTrackInput,
): Promise<TouchAttributionResult | null> {
  const visitorId = input.visitorId.trim().slice(0, 128);
  if (!visitorId) return null;
  const sid = (input.sessionId ?? "").trim().slice(0, 128) || "default";

  const meta = input.metadata && typeof input.metadata === "object" ? input.metadata : {};
  const fromMeta = extractUtmFromMetadata(meta);
  const landing = input.pageVisited ?? (typeof meta.landing_page === "string" ? meta.landing_page : null);

  const snap = touchSnapshot(fromMeta, landing, {
    component: meta.component,
    section: meta.section,
  });

  const campaigns = await storage.listPpcCampaigns();
  const resolvedCampaign = resolvePpcCampaignIdFromContext(campaigns, fromMeta, landing);

  const [existing] = await db
    .select()
    .from(ppcAttributionSessions)
    .where(and(eq(ppcAttributionSessions.visitorId, visitorId), eq(ppcAttributionSessions.sessionId, sid)))
    .limit(1);

  const now = new Date();

  if (!existing) {
    const publicId = `atts_${randomBytes(9).toString("hex")}`;
    const [row] = await db
      .insert(ppcAttributionSessions)
      .values({
        publicId,
        visitorId,
        sessionId: sid,
        firstTouchJson: snap,
        lastTouchJson: snap,
        firstLandingPath: landing?.trim() || null,
        lastLandingPath: landing?.trim() || null,
        ppcCampaignId: resolvedCampaign,
        crmContactId: input.crmContactId ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!row) return null;
    return { id: row.id, publicId: row.publicId, ppcCampaignId: row.ppcCampaignId ?? null };
  }

  const firstTouch = { ...(existing.firstTouchJson as Record<string, unknown>) };
  if (Object.keys(firstTouch).length === 0) {
    Object.assign(firstTouch, snap);
  }

  const [row] = await db
    .update(ppcAttributionSessions)
    .set({
      lastTouchJson: snap,
      lastLandingPath: landing?.trim() || existing.lastLandingPath,
      ppcCampaignId: existing.ppcCampaignId ?? resolvedCampaign ?? null,
      crmContactId: input.crmContactId ?? existing.crmContactId ?? null,
      updatedAt: now,
    })
    .where(eq(ppcAttributionSessions.id, existing.id))
    .returning();

  if (!row) return null;
  return { id: row.id, publicId: row.publicId, ppcCampaignId: row.ppcCampaignId ?? null };
}

export type FormTouchInput = TouchUtm & {
  visitorId?: string | null;
  sessionId?: string | null;
  landing_page?: string | null;
  referrer?: string | null;
};

/**
 * Form submission may carry fresher UTMs — merge as last touch and link CRM contact.
 */
export async function touchAttributionSessionFromForm(
  storage: IStorage,
  contactId: number,
  attribution: FormTouchInput | null | undefined,
): Promise<TouchAttributionResult | null> {
  const visitorId = attribution?.visitorId?.trim();
  if (!visitorId) return null;
  const sessionId = attribution?.sessionId?.trim() || "default";
  const snap = touchSnapshot(
    {
      utm_source: attribution?.utm_source,
      utm_medium: attribution?.utm_medium,
      utm_campaign: attribution?.utm_campaign,
      utm_content: attribution?.utm_content,
      utm_term: attribution?.utm_term,
    },
    attribution?.landing_page ?? null,
    { referrer: attribution?.referrer ?? undefined, source: "form_submit" },
  );
  const campaigns = await storage.listPpcCampaigns();
  const resolvedCampaign = resolvePpcCampaignIdFromContext(campaigns, snap, attribution?.landing_page ?? null);

  const [existing] = await db
    .select()
    .from(ppcAttributionSessions)
    .where(and(eq(ppcAttributionSessions.visitorId, visitorId), eq(ppcAttributionSessions.sessionId, sessionId)))
    .limit(1);

  const now = new Date();

  if (!existing) {
    const publicId = `atts_${randomBytes(9).toString("hex")}`;
    const [row] = await db
      .insert(ppcAttributionSessions)
      .values({
        publicId,
        visitorId,
        sessionId,
        firstTouchJson: snap,
        lastTouchJson: snap,
        firstLandingPath: attribution?.landing_page?.trim() || null,
        lastLandingPath: attribution?.landing_page?.trim() || null,
        ppcCampaignId: resolvedCampaign,
        crmContactId: contactId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!row) return null;
    return { id: row.id, publicId: row.publicId, ppcCampaignId: row.ppcCampaignId ?? null };
  }

  const first = (existing.firstTouchJson as Record<string, unknown>) || {};
  const nextFirst = Object.keys(first).length ? first : snap;

  const [row] = await db
    .update(ppcAttributionSessions)
    .set({
      firstTouchJson: nextFirst,
      lastTouchJson: snap,
      lastLandingPath: attribution?.landing_page?.trim() || existing.lastLandingPath,
      ppcCampaignId: existing.ppcCampaignId ?? resolvedCampaign ?? null,
      crmContactId: contactId,
      updatedAt: now,
    })
    .where(eq(ppcAttributionSessions.id, existing.id))
    .returning();

  if (!row) return null;
  return { id: row.id, publicId: row.publicId, ppcCampaignId: row.ppcCampaignId ?? null };
}
