import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { runPpcPublishPipeline } from "@server/services/paid-growth/publishPipeline";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const result = await runPpcPublishPipeline(id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error, details: result.details }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Publish failed" }, { status: 500 });
  }
}
