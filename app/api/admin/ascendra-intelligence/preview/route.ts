import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function stripScriptTags(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

function htmlToPlainPreview(html: string, maxLen = 400): string {
  const stripped = stripScriptTags(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > maxLen ? `${stripped.slice(0, maxLen)}…` : stripped;
}

const previewSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("landing"), offerSlug: z.string().min(1) }),
  z.object({
    mode: z.literal("dm"),
    text: z.string(),
    personaDisplayName: z.string().optional(),
  }),
  z.object({
    mode: z.literal("email"),
    html: z.string(),
    subject: z.string().optional(),
  }),
]);

/** POST /api/admin/ascendra-intelligence/preview — internal admin only; no persistence. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => null);
    const parsed = previewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    const b = parsed.data;
    if (b.mode === "landing") {
      const offer = await storage.getSiteOffer(b.offerSlug);
      if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
      const sections = (offer.sections ?? {}) as Record<string, unknown>;
      const hero = sections.hero as { title?: string; subtitle?: string } | undefined;
      const cta = sections.cta as { buttonText?: string; buttonHref?: string } | undefined;
      const bullets = sections.bullets as string[] | undefined;
      return NextResponse.json({
        mode: "landing",
        offerSlug: b.offerSlug,
        name: offer.name,
        metaTitle: offer.metaTitle,
        metaDescription: offer.metaDescription,
        heroTitle: hero?.title ?? null,
        heroSubtitle: hero?.subtitle ?? null,
        ctaButton: cta?.buttonText ?? null,
        ctaHref: cta?.buttonHref ?? null,
        bullets: Array.isArray(bullets) ? bullets : [],
      });
    }

    if (b.mode === "dm") {
      const plainText = b.text.replace(/\r\n/g, "\n").trim();
      return NextResponse.json({
        mode: "dm",
        plainText,
        charCount: plainText.length,
        personaDisplayName: b.personaDisplayName ?? null,
      });
    }

    const safeNote =
      "Scripts removed; this is an internal preview only—not a full sanitizer for untrusted HTML.";
    return NextResponse.json({
      mode: "email",
      subject: b.subject ?? "(no subject)",
      htmlSanitizedNote: safeNote,
      previewTextPlain: htmlToPlainPreview(b.html),
    });
  } catch (e) {
    console.error("[POST ascendra-intelligence/preview]", e);
    return NextResponse.json({ error: "Preview failed" }, { status: 500 });
  }
}
