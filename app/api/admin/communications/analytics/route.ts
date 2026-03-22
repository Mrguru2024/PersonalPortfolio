import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const campaigns = await storage.listCommCampaigns();
    let totalSent = 0;
    let totalOpened = 0;
    let totalClicked = 0;
    const blockClicks: Record<string, number> = {};

    const rows = await Promise.all(
      campaigns.map(async (c) => {
        const sent = c.sentCount ?? 0;
        const opened = c.openedCount ?? 0;
        const clicked = c.clickedCount ?? 0;
        totalSent += sent;
        totalOpened += opened;
        totalClicked += clicked;
        const openRate = sent > 0 ? Math.round((opened / sent) * 1000) / 10 : 0;
        const clickRate = sent > 0 ? Math.round((clicked / sent) * 1000) / 10 : 0;

        const sends = sent > 0 ? await storage.getCommCampaignSendsByCampaignId(c.id) : [];
        const ab = {
          a: { sent: 0, opened: 0, clicked: 0 },
          b: { sent: 0, opened: 0, clicked: 0 },
        };
        for (const s of sends) {
          if (s.status !== "sent") continue;
          if (s.firstClickedBlockId) {
            const bid = s.firstClickedBlockId;
            blockClicks[bid] = (blockClicks[bid] ?? 0) + 1;
          }
          if (s.abVariant === "b") {
            ab.b.sent += 1;
            if (s.openedAt) ab.b.opened += 1;
            if (s.clickedAt) ab.b.clicked += 1;
          } else if (s.abVariant === "a") {
            ab.a.sent += 1;
            if (s.openedAt) ab.a.opened += 1;
            if (s.clickedAt) ab.a.clicked += 1;
          }
        }
        const abSummary =
          c.abTestEnabled && (ab.a.sent > 0 || ab.b.sent > 0) ?
            {
              a: {
                sent: ab.a.sent,
                openRate: ab.a.sent > 0 ? Math.round((ab.a.opened / ab.a.sent) * 1000) / 10 : 0,
                clickRate: ab.a.sent > 0 ? Math.round((ab.a.clicked / ab.a.sent) * 1000) / 10 : 0,
              },
              b: {
                sent: ab.b.sent,
                openRate: ab.b.sent > 0 ? Math.round((ab.b.opened / ab.b.sent) * 1000) / 10 : 0,
                clickRate: ab.b.sent > 0 ? Math.round((ab.b.clicked / ab.b.sent) * 1000) / 10 : 0,
              },
            }
          : null;

        return {
          id: c.id,
          name: c.name,
          status: c.status,
          campaignType: c.campaignType,
          abTestEnabled: c.abTestEnabled,
          sentAt: c.sentAt,
          sent,
          opened,
          clicked,
          openRate,
          clickRate,
          ctor: opened > 0 ? Math.round((clicked / opened) * 1000) / 10 : 0,
          abSummary,
        };
      })
    );
    const aggregateOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 1000) / 10 : 0;
    const aggregateClickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 1000) / 10 : 0;
    return NextResponse.json({
      totals: {
        campaigns: campaigns.length,
        sent: totalSent,
        opened: totalOpened,
        clicked: totalClicked,
        openRate: aggregateOpenRate,
        clickRate: aggregateClickRate,
        clickToOpenRate: totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 1000) / 10 : 0,
      },
      blockClicks,
      campaigns: rows.sort((a, b) => {
        const ta = a.sentAt ? new Date(a.sentAt).getTime() : 0;
        const tb = b.sentAt ? new Date(b.sentAt).getTime() : 0;
        return tb - ta;
      }),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
