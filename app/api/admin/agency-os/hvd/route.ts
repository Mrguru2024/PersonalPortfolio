import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import {
  createAosHvdRegistryEntry,
  detectLowValueOrOverlapSlug,
  listAosHvdRegistry,
} from "@server/services/agencyOs/agencyOsService";
import { agencyOsHvdRegistryCreateSchema } from "@shared/agencyOsValidation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  try {
    const entries = await listAosHvdRegistry();
    return NextResponse.json({ entries });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load HVD registry" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const user = await getSessionUser(req);
  if (!user?.adminApproved) {
    return NextResponse.json({ message: "Approved admin required" }, { status: 403 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as unknown;
    const parsed = agencyOsHvdRegistryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const overlap = detectLowValueOrOverlapSlug(parsed.data.slug, parsed.data.name);
    const row = await createAosHvdRegistryEntry({
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      defaultOutcomeHints: parsed.data.defaultOutcomeHints ?? null,
      sortOrder: parsed.data.sortOrder,
    });
    return NextResponse.json({ entry: row, warning: overlap.warn ? overlap.message : undefined });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
