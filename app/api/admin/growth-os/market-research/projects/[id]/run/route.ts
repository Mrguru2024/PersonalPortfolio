import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { marketResearchRunBodySchema } from "@/lib/market-research/requestSchema";
import { runMarketResearchProject } from "@server/services/marketResearch/marketResearchService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseId(value: string): number | null {
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const projectId = parseId(id);
    if (!projectId) {
      return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
    }

    const parsed = marketResearchRunBodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
    }

    const user = await getSessionUser(req);
    const actorUserId = user?.id != null ? Number(user.id) : null;

    const result = await runMarketResearchProject({
      projectId,
      actorUserId: Number.isFinite(actorUserId) ? actorUserId : null,
      triggerType: parsed.data.triggerType,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message.toLowerCase().includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
