import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { computeLeadControlPriority } from "@shared/leadControlPriority";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/lead-control/summary — command center counts (CRM-backed, no duplicate tables) */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const [contacts, stats] = await Promise.all([storage.getCrmContacts(), storage.getCrmDashboardStats()]);

    const now = new Date();
    const leads = contacts.filter((c) => c.type === "lead");

    let p1 = 0;
    let p2 = 0;
    let needsFirstTouch = 0;
    for (const c of leads) {
      const p = (c.leadControlPriority as string | null) || computeLeadControlPriority(c, now);
      if (p === "P1") p1++;
      if (p === "P2") p2++;
      if (!c.firstResponseAt && (c.status === "new" || !c.status)) needsFirstTouch++;
    }

    const newLeads = leads.filter((c) => c.status === "new" || c.status === "").length;
    const bookedCalls = leads.filter((c) => c.bookedCallAt != null).length;
    const hotIntent = leads.filter((c) => {
      const i = (c.intentLevel ?? "").toLowerCase();
      return i === "hot_lead" || i.includes("hot");
    }).length;

    return NextResponse.json({
      totals: {
        crmContacts: contacts.length,
        activeLeads: leads.length,
        newLeads,
        p1Urgent: p1,
        p2High: p2,
        hotIntent,
        bookedCalls,
        needsFirstTouch,
        followUpNeeded: stats.followUpNeededCount,
        overdueTasks: stats.overdueTasks.length,
        proposalReady: stats.proposalReadyCount,
      },
    });
  } catch (e) {
    console.error("[GET /api/admin/lead-control/summary]", e);
    return NextResponse.json({ error: "Failed to load summary" }, { status: 500 });
  }
}
