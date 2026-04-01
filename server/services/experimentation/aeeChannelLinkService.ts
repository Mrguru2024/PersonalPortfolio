import { db } from "@server/db";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import {
  aeeExperimentChannelLinks,
  aeeExperimentAuditLog,
  ppcCampaigns,
  ppcPerformanceSnapshots,
} from "@shared/schema";

export async function listAeeChannelLinksForExperiment(experimentId: number) {
  return db
    .select()
    .from(aeeExperimentChannelLinks)
    .where(eq(aeeExperimentChannelLinks.experimentId, experimentId))
    .orderBy(desc(aeeExperimentChannelLinks.createdAt));
}

export async function createAeeChannelLink(input: {
  experimentId: number;
  variantId?: number | null;
  channelType: string;
  landingPath?: string | null;
  ppcCampaignId?: number | null;
  commCampaignId?: number | null;
  utmSnapshotJson?: Record<string, string>;
  notes?: string | null;
  actorUserId?: number | null;
}): Promise<{ id: number }> {
  const [row] = await db
    .insert(aeeExperimentChannelLinks)
    .values({
      experimentId: input.experimentId,
      variantId: input.variantId ?? null,
      channelType: input.channelType.trim(),
      landingPath: input.landingPath?.trim() || null,
      ppcCampaignId: input.ppcCampaignId ?? null,
      commCampaignId: input.commCampaignId ?? null,
      utmSnapshotJson: input.utmSnapshotJson ?? {},
      notes: input.notes?.trim() || null,
    })
    .returning({ id: aeeExperimentChannelLinks.id });

  if (row?.id) {
    await db.insert(aeeExperimentAuditLog).values({
      experimentId: input.experimentId,
      actorUserId: input.actorUserId ?? null,
      action: "channel_link_created",
      payloadJson: { linkId: row.id, channelType: input.channelType },
    });
  }
  return { id: row!.id };
}

export async function deleteAeeChannelLink(linkId: number, experimentId: number, actorUserId?: number | null): Promise<boolean> {
  const res = await db
    .delete(aeeExperimentChannelLinks)
    .where(and(eq(aeeExperimentChannelLinks.id, linkId), eq(aeeExperimentChannelLinks.experimentId, experimentId)))
    .returning({ id: aeeExperimentChannelLinks.id });
  if (res.length) {
    await db.insert(aeeExperimentAuditLog).values({
      experimentId,
      actorUserId: actorUserId ?? null,
      action: "channel_link_deleted",
      payloadJson: { linkId },
    });
    return true;
  }
  return false;
}

export type PpcJoinCampaignRow = {
  linkId: number;
  campaignId: number;
  campaignName: string;
  platform: string;
  variantId: number | null;
  snapshots: Array<{
    snapshotDate: string;
    impressions: number;
    clicks: number;
    spendCents: number;
    conversions: number;
  }>;
  totals: { impressions: number; clicks: number; spendCents: number; conversions: number };
};

export async function getPpcSnapshotJoinForExperiment(
  experimentId: number,
  maxSnapshotsPerCampaign = 30,
): Promise<PpcJoinCampaignRow[]> {
  const links = await db
    .select()
    .from(aeeExperimentChannelLinks)
    .where(and(eq(aeeExperimentChannelLinks.experimentId, experimentId), isNotNull(aeeExperimentChannelLinks.ppcCampaignId)));

  const out: PpcJoinCampaignRow[] = [];
  for (const link of links) {
    if (link.ppcCampaignId == null) continue;
    const [camp] = await db
      .select({
        id: ppcCampaigns.id,
        name: ppcCampaigns.name,
        platform: ppcCampaigns.platform,
      })
      .from(ppcCampaigns)
      .where(eq(ppcCampaigns.id, link.ppcCampaignId))
      .limit(1);
    if (!camp) continue;

    const snaps = await db
      .select()
      .from(ppcPerformanceSnapshots)
      .where(eq(ppcPerformanceSnapshots.campaignId, link.ppcCampaignId))
      .orderBy(desc(ppcPerformanceSnapshots.snapshotDate))
      .limit(maxSnapshotsPerCampaign);

    let ti = 0,
      tc = 0,
      ts = 0,
      tconv = 0;
    const snapRows = snaps.map((s) => {
      const d = String(s.snapshotDate ?? "").slice(0, 10);
      const imp = s.impressions ?? 0;
      const clk = s.clicks ?? 0;
      const sp = s.spendCents ?? 0;
      const conv = s.conversions ?? 0;
      ti += imp;
      tc += clk;
      ts += sp;
      tconv += conv;
      return { snapshotDate: d, impressions: imp, clicks: clk, spendCents: sp, conversions: conv };
    });

    out.push({
      linkId: link.id,
      campaignId: camp.id,
      campaignName: camp.name,
      platform: camp.platform,
      variantId: link.variantId,
      snapshots: snapRows,
      totals: { impressions: ti, clicks: tc, spendCents: ts, conversions: tconv },
    });
  }
  return out;
}
