import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { runPpcOptimizationRulesSweep } from "@server/services/paid-growth/optimizationRulesEngine";

export const dynamic = "force-dynamic";

/** POST — execute rules-based optimization sweep (idempotent upserts). */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const result = await runPpcOptimizationRulesSweep(storage);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Optimization sweep failed" }, { status: 500 });
  }
}
