import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import {
  getOrCreateOperatorProfile,
  updateOperatorProfile,
} from "@server/services/adminOperatorProfileService";
import { ADMIN_OPERATOR_ROLE_OPTIONS } from "@shared/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const roleZ = z.enum(ADMIN_OPERATOR_ROLE_OPTIONS as unknown as [string, ...string[]]);

const patchSchema = z
  .object({
    roleSelection: roleZ.optional(),
    mission: z.string().nullable().optional(),
    vision: z.string().nullable().optional(),
    goals: z.string().nullable().optional(),
    taskFocus: z.string().nullable().optional(),
  })
  .strict();

function normalizeOptionalText(v: string | null | undefined): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

/** GET /api/admin/operator-profile — current admin workspace profile + cached AI plan */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const sessionUser = await getSessionUser(req);
    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const profile = await getOrCreateOperatorProfile(sessionUser.id);
    return NextResponse.json({ profile });
  } catch (e) {
    console.error("[GET admin/operator-profile]", e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("admin_operator_profiles") && /does not exist|relation/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            "Database table admin_operator_profiles is missing. Apply the schema (e.g. npm run db:push), then try again.",
          code: "operator_profile_schema_missing",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

/** PATCH /api/admin/operator-profile */
export async function PATCH(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const sessionUser = await getSessionUser(req);
    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    const p = parsed.data;
    const profile = await updateOperatorProfile(sessionUser.id, {
      ...(p.roleSelection !== undefined ? { roleSelection: p.roleSelection } : {}),
      ...(p.mission !== undefined ? { mission: normalizeOptionalText(p.mission) ?? null } : {}),
      ...(p.vision !== undefined ? { vision: normalizeOptionalText(p.vision) ?? null } : {}),
      ...(p.goals !== undefined ? { goals: normalizeOptionalText(p.goals) ?? null } : {}),
      ...(p.taskFocus !== undefined ? { taskFocus: normalizeOptionalText(p.taskFocus) ?? null } : {}),
    });
    return NextResponse.json({ profile });
  } catch (e) {
    console.error("[PATCH admin/operator-profile]", e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("admin_operator_profiles") && /does not exist|relation/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            "Database table admin_operator_profiles is missing. Apply the schema (e.g. npm run db:push), then try again.",
          code: "operator_profile_schema_missing",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
