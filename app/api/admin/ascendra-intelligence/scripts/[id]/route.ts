import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import { SCRIPT_TEMPLATE_CATEGORIES } from "@shared/schema";
import {
  deleteScriptTemplate,
  getMarketingPersona,
  getScriptTemplate,
  updateScriptTemplate,
} from "@server/services/ascendraIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const scriptCategoryZ = z.enum(SCRIPT_TEMPLATE_CATEGORIES as unknown as [string, ...string[]]);

const patchSchema = z
  .object({
    personaId: z.string().min(1).optional(),
    category: scriptCategoryZ.optional(),
    name: z.string().min(1).optional(),
    bodyMd: z.string().optional(),
    variables: z.array(z.string()).optional(),
    status: z.enum(["draft", "approved", "published"]).optional(),
  })
  .strict();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const id = Number.parseInt((await params).id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const script = await getScriptTemplate(id);
    if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ script });
  } catch (e) {
    console.error("[GET ascendra-intelligence/scripts/id]", e);
    return NextResponse.json({ error: "Failed to load script" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const id = Number.parseInt((await params).id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    if (parsed.data.personaId) {
      const persona = await getMarketingPersona(parsed.data.personaId);
      if (!persona) {
        return NextResponse.json({ error: "Unknown personaId" }, { status: 400 });
      }
    }
    const script = await updateScriptTemplate(id, parsed.data);
    if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ script });
  } catch (e) {
    console.error("[PATCH ascendra-intelligence/scripts/id]", e);
    return NextResponse.json({ error: "Failed to update script" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const id = Number.parseInt((await params).id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const ok = await deleteScriptTemplate(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE ascendra-intelligence/scripts/id]", e);
    return NextResponse.json({ error: "Failed to delete script" }, { status: 500 });
  }
}
