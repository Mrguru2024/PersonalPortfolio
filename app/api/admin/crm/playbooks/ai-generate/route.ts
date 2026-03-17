import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { generatePlaybookContent } from "@server/services/playbookAIService";

export const dynamic = "force-dynamic";

/** POST /api/admin/crm/playbooks/ai-generate — generate playbook content with AI. Body: { title, category?, serviceType? }. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const content = await generatePlaybookContent({
      title,
      category: body.category ?? null,
      serviceType: body.serviceType ?? null,
    });
    return NextResponse.json(content);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/OPENAI_API_KEY|disabled/i.test(msg)) {
      return NextResponse.json({ error: "AI generation is not configured. Set OPENAI_API_KEY to enable." }, { status: 503 });
    }
    console.error("Playbooks AI generate error:", error);
    return NextResponse.json({ error: msg || "Failed to generate playbook content" }, { status: 500 });
  }
}
