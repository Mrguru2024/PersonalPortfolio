import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import {
  runCommDesignAssist,
  type CommDesignAiIntent,
} from "@server/services/communications/commDesignAiService";

export const dynamic = "force-dynamic";

const INTENTS: CommDesignAiIntent[] = ["subject_lines", "preheader", "html_section", "polish_html"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const design = await storage.getCommEmailDesignById(id);
    if (!design) return NextResponse.json({ error: "Design not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const intent = INTENTS.includes(body.intent as CommDesignAiIntent) ? (body.intent as CommDesignAiIntent) : null;
    if (!intent) {
      return NextResponse.json({ error: "intent must be subject_lines | preheader | html_section | polish_html" }, { status: 400 });
    }
    const instruction = typeof body.instruction === "string" ? body.instruction : undefined;
    const subject = typeof body.subject === "string" ? body.subject : design.subject;
    const previewText = typeof body.previewText === "string" ? body.previewText : (design.previewText ?? "");
    const htmlSample = typeof body.htmlSample === "string" ? body.htmlSample : design.htmlContent;

    const result = await runCommDesignAssist({
      intent,
      designName: design.name,
      subject,
      previewText,
      htmlSample,
      instruction,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 503 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "AI assist failed" }, { status: 500 });
  }
}
