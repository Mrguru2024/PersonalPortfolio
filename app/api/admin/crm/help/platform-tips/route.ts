import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getAdminPlatformTips } from "@server/services/playbookAIService";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/help/platform-tips?section=playbooks — guidance tips for the CRM (playbooks, discovery, proposal-prep, contacts, pipeline, or general). */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const section = req.nextUrl.searchParams.get("section") ?? undefined;
    const { tips, source } = await getAdminPlatformTips(section);
    return NextResponse.json({ tips, source });
  } catch (error: unknown) {
    console.error("Platform tips error:", error);
    return NextResponse.json(
      { error: "Failed to load platform tips" },
      { status: 500 }
    );
  }
}
