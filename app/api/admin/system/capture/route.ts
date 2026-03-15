import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { captureError } from "@/lib/systemMonitor";

/**
 * POST /api/admin/system/capture
 * Body: { message, stack?, url?, route? } — record a client-side error. Super user only.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isSuperUser(req))) {
      return NextResponse.json(
        { message: "Super user access required" },
        { status: 403 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const message = body?.message ?? "Unknown error";
    const stack = body?.stack;
    const url = body?.url;
    const route = body?.route;
    const err = new Error(message);
    if (stack) (err as Error & { stack: string }).stack = stack;
    captureError(err, { route, url, method: "client" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("System capture POST error:", error);
    return NextResponse.json(
      { message: "Failed to capture" },
      { status: 500 }
    );
  }
}
