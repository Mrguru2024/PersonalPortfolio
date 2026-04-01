import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import OpenAI from "@server/openai/nodeClient";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB for upload

export interface BusinessCardExtracted {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  website?: string | null;
  address?: string | null;
}

/**
 * POST /api/admin/crm/business-card
 * Body: { image: string (data URL or base64), contactId?: number }
 * Extracts contact info from business card image via OpenAI Vision. If contactId is provided,
 * updates the contact with extracted fields and saves the card image in customFields.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    let imageData = body.image as string | undefined;
    if (!imageData || typeof imageData !== "string") {
      return NextResponse.json(
        { error: "image is required (data URL or base64 string)" },
        { status: 400 }
      );
    }

    // Normalize to base64 (strip data URL prefix if present)
    let base64 = imageData;
    const dataUrlMatch = imageData.match(/^data:image\/\w+;base64,(.+)$/);
    if (dataUrlMatch) base64 = dataUrlMatch[1];
    const buf = Buffer.from(base64, "base64");
    if (buf.length > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image too large. Use a smaller image (e.g. under 4 MB)." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not set. Business card extraction requires OpenAI." },
        { status: 503 }
      );
    }

    const openai = new OpenAI({ apiKey });
    const imageUrl = imageData.startsWith("data:") ? imageData : `data:image/jpeg;base64,${base64}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract contact information from this business card image. Return a JSON object only, with these keys (use null for missing): name, email, phone, company, jobTitle, website, address. No other text, just the JSON.`,
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    let extracted: BusinessCardExtracted = {};
    try {
      const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ""));
      extracted = {
        name: parsed.name ?? null,
        email: parsed.email ?? null,
        phone: parsed.phone ?? null,
        company: parsed.company ?? null,
        jobTitle: parsed.jobTitle ?? null,
        website: parsed.website ?? null,
        address: parsed.address ?? null,
      };
    } catch {
      extracted = {};
    }

    const contactId = typeof body.contactId === "number" ? body.contactId : null;
    if (contactId) {
      const existing = await storage.getCrmContactById(contactId);
      if (existing) {
        const customFields = (existing.customFields as Record<string, unknown>) ?? {};
        const updates: Record<string, unknown> = {
          ...(extracted.name && { name: extracted.name }),
          ...(extracted.email && { email: extracted.email }),
          ...(extracted.phone && { phone: extracted.phone }),
          ...(extracted.company && { company: extracted.company }),
          ...(extracted.jobTitle && { jobTitle: extracted.jobTitle }),
          ...(extracted.website && { linkedinUrl: extracted.website }),
          customFields: {
            ...customFields,
            ...(imageData.length <= 100000 && { businessCardImage: imageData }),
          },
        };
        await storage.updateCrmContact(contactId, updates);
      }
    }

    return NextResponse.json({
      extracted,
      savedToContact: !!contactId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Business card extraction failed";
    console.error("Business card API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
