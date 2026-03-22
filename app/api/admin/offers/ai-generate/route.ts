import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import { generateOfferFieldsFromPrompt, isOfferAiFillAvailable } from "@server/services/offerAiFillService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z
  .object({
    prompt: z.string().min(1).max(8000),
    slug: z.string().max(200).optional(),
    includeCurrent: z.boolean().optional(),
    currentOffer: z
      .object({
        name: z.string().optional(),
        metaTitle: z.string().nullable().optional(),
        metaDescription: z.string().nullable().optional(),
        sections: z.record(z.any()).optional(),
      })
      .optional(),
  })
  .strict();

/** POST /api/admin/offers/ai-generate — draft offer fields from a natural-language prompt (admin). */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    if (!isOfferAiFillAvailable()) {
      return NextResponse.json(
        { error: "AI generation is not configured. Set OPENAI_API_KEY to enable." },
        { status: 503 },
      );
    }

    const raw = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    const { prompt, slug, includeCurrent, currentOffer } = parsed.data;
    const payload = await generateOfferFieldsFromPrompt({
      prompt,
      slug,
      currentOffer: includeCurrent !== false && currentOffer ? currentOffer : undefined,
    });

    return NextResponse.json({ offer: payload });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/OPENAI_API_KEY|disabled/i.test(msg)) {
      return NextResponse.json({ error: "AI generation is not configured. Set OPENAI_API_KEY to enable." }, { status: 503 });
    }
    console.error("[POST /api/admin/offers/ai-generate]", e);
    return NextResponse.json({ error: msg || "Failed to generate offer" }, { status: 500 });
  }
}
