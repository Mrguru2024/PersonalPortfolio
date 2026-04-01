import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { listAfnTagVocabulary } from "@server/afnStorage";

export const dynamic = "force-dynamic";

/** GET /api/community/tags — AFN normalized tag dimensions for forms (auth). */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const vocab = await listAfnTagVocabulary();
    return NextResponse.json(vocab);
  } catch (e) {
    console.error("GET community tags error:", e);
    return NextResponse.json({ error: "Failed to load tags" }, { status: 500 });
  }
}
