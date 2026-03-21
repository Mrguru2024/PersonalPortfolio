import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import { SCRIPT_TEMPLATE_CATEGORIES } from "@shared/schema";
import {
  createScriptTemplate,
  getMarketingPersona,
  listScriptTemplates,
} from "@server/services/ascendraIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const scriptCategoryZ = z.enum(SCRIPT_TEMPLATE_CATEGORIES as unknown as [string, ...string[]]);

const postSchema = z
  .object({
    personaId: z.string().min(1),
    category: scriptCategoryZ,
    name: z.string().min(1),
    bodyMd: z.string().optional(),
    variables: z.array(z.string()).optional(),
    status: z.enum(["draft", "approved", "published"]).optional(),
  })
  .strict();

/** GET /api/admin/ascendra-intelligence/scripts?personaId= */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const personaId = req.nextUrl.searchParams.get("personaId")?.trim() || undefined;
    const scripts = await listScriptTemplates(personaId);
    return NextResponse.json({ scripts });
  } catch (e) {
    console.error("[GET ascendra-intelligence/scripts]", e);
    return NextResponse.json({ error: "Failed to list scripts" }, { status: 500 });
  }
}

/** POST /api/admin/ascendra-intelligence/scripts */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => null);
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    const persona = await getMarketingPersona(parsed.data.personaId);
    if (!persona) {
      return NextResponse.json({ error: "Unknown personaId" }, { status: 400 });
    }
    const script = await createScriptTemplate(parsed.data);
    return NextResponse.json({ script }, { status: 201 });
  } catch (e) {
    console.error("[POST ascendra-intelligence/scripts]", e);
    return NextResponse.json({ error: "Failed to create script" }, { status: 500 });
  }
}
