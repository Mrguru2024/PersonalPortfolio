import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { leadQualityGuidanceFromRows } from "@server/services/paid-growth/paidGrowthRecommendations";
import {
  PPC_GROWTH_ROUTE_RECOMMENDATIONS,
  growthRouteRecommendationLabel,
  type PpcGrowthRouteRecommendation,
} from "@shared/ppcBusinessRules";
import type { PpcLeadQuality } from "@shared/paidGrowthSchema";
import type { ClientPpcSummaryCampaign, ClientPpcSummaryResponse } from "@shared/clientPpcSummary";

export type { ClientPpcSummaryResponse } from "@shared/clientPpcSummary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseVisibleCampaignIds(): number[] {
  const raw = process.env.ASCENDRA_PPC_CLIENT_VISIBLE_CAMPAIGN_IDS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function clientFriendlyCampaignStatus(status: string): string {
  const labels: Record<string, string> = {
    draft: "In setup",
    ready_for_review: "In review",
    validation_failed: "Needs attention",
    approved: "Ready to go live",
    publishing: "Going live",
    published: "Live",
    paused: "Paused",
    archived: "Archived",
    sync_error: "Connection issue",
  };
  return labels[status] ?? status.replace(/_/g, " ");
}

/**
 * Client-safe PPC summary. When `ASCENDRA_PPC_CLIENT_SUMMARY_ENABLED` is not true, returns `mode: disabled` (200) for
 * eligible signed-in users so the UI can explain next steps without treating it as an error.
 *
 * When enabled, campaign scope is `ASCENDRA_PPC_CLIENT_VISIBLE_CAMPAIGN_IDS` (comma-separated).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
    }
    const eligible = await storage.getClientPortalEligibility(Number(user.id));
    if (!eligible) {
      return NextResponse.json({ error: "Client workspace is not available for your account" }, { status: 403 });
    }

    if (process.env.ASCENDRA_PPC_CLIENT_SUMMARY_ENABLED !== "true") {
      const body: ClientPpcSummaryResponse = {
        mode: "disabled",
        headline: "Advertising results are not enabled for your portal yet",
        body:
          "When your project includes paid ads reporting, Ascendra can turn on this summary for you. You can still use invoices, proposals, and your growth system from the main dashboard.",
      };
      return NextResponse.json(body);
    }

    const visibleIds = parseVisibleCampaignIds();
    if (visibleIds.length === 0) {
      const body: ClientPpcSummaryResponse = {
        mode: "pending",
        pendingReason: "no_campaigns_linked",
        headline: "Almost there — campaigns are not linked to this view yet",
        body:
          "Your strategist connects your ads to this secure page. You will then see leads, calls booked, and high-level campaign status here—without needing the full ads platform.",
        campaigns: [],
        primary: { qualifiedLeads: 0, bookedCalls: 0, newCustomers: 0 },
        recommendations: [],
      };
      return NextResponse.json(body);
    }

    const campaigns: ClientPpcSummaryCampaign[] = [];
    const allLeadRows: PpcLeadQuality[] = [];
    const recommendationTitles: string[] = [];

    for (const id of visibleIds) {
      const c = await storage.getPpcCampaignById(id);
      if (!c) continue;
      const snap = c.readinessSnapshotJson as { growthRoute?: string } | null;
      let growthRouteLabel: string | null = null;
      const gr = snap?.growthRoute;
      if (typeof gr === "string" && (PPC_GROWTH_ROUTE_RECOMMENDATIONS as readonly string[]).includes(gr)) {
        growthRouteLabel = growthRouteRecommendationLabel(gr as PpcGrowthRouteRecommendation);
      }
      campaigns.push({
        id: c.id,
        name: c.name,
        status: c.status,
        statusLabel: clientFriendlyCampaignStatus(c.status),
        clientLabel: c.clientLabel ?? null,
        readinessScore: c.readinessScore ?? null,
        growthRouteLabel,
      });

      const leads = await storage.listPpcLeadQualityForCampaign(id, 80);
      for (const row of leads) {
        allLeadRows.push(row);
      }

      const recs = await storage.listPpcOptimizationRecommendations(id, [...R_CLIENT_VISIBLE_OPT_STATUSES]);
      for (const r of recs) {
        if (r.status === "open") recommendationTitles.push(r.title);
      }
    }

    if (campaigns.length === 0) {
      const body: ClientPpcSummaryResponse = {
        mode: "pending",
        pendingReason: "campaigns_not_found",
        headline: "We could not load your campaign details",
        body:
          "The link to your ads may need a quick refresh on our side. Your strategist can verify the campaign list. Metrics below will fill in once tracking is connected.",
        campaigns: [],
        primary: { qualifiedLeads: 0, bookedCalls: 0, newCustomers: 0 },
        recommendations: [],
      };
      return NextResponse.json(body);
    }

    const hints = leadQualityGuidanceFromRows(allLeadRows);
    const recommendations = Array.from(new Set([...recommendationTitles, ...hints])).slice(0, 12);

    const qualified = allLeadRows.filter((l) => l.leadValid && !l.spamFlag).length;
    const booked = allLeadRows.filter((l) => l.bookedCall).length;
    const newCustomers = allLeadRows.filter((l) => l.sold).length;

    const body: ClientPpcSummaryResponse = {
      mode: "ready",
      campaigns,
      primary: {
        qualifiedLeads: qualified,
        bookedCalls: booked,
        newCustomers,
      },
      recommendations,
    };
    return NextResponse.json(body);
  } catch (e) {
    console.error("[client/ppc-summary]", e);
    return NextResponse.json({ error: "Failed to load PPC summary" }, { status: 500 });
  }
}

const R_CLIENT_VISIBLE_OPT_STATUSES = ["open"] as const;
