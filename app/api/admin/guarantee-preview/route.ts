import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { guaranteePreviewInputSchema } from "@shared/guaranteeEngine";
import { calculateGuaranteePreview } from "@server/services/guaranteeEngineService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const parsed = guaranteePreviewInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid preview input", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const preview = calculateGuaranteePreview(parsed.data);
    return NextResponse.json(preview);
  } catch (error) {
    console.error("[admin/guarantee-preview] POST failed:", error);
    return NextResponse.json({ message: "Failed to run guarantee preview" }, { status: 500 });
  }
}
