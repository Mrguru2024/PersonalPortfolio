import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { PPC_OPTIMIZATION_STATUSES } from "@shared/paidGrowthSchema";

export const dynamic = "force-dynamic";

function isStatus(v: string): v is (typeof PPC_OPTIMIZATION_STATUSES)[number] {
  return (PPC_OPTIMIZATION_STATUSES as readonly string[]).includes(v);
}

/** PATCH — update recommendation status (applied / dismissed / snoozed / open). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const body = await req.json().catch(() => ({}));
    const status = typeof body.status === "string" ? body.status : "";
    if (!isStatus(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const updated = await storage.updatePpcOptimizationRecommendation(id, { status });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
