import { NextResponse } from "next/server";
import { getAfnDiscussionCategories } from "@server/afnStorage";

export const dynamic = "force-dynamic";

/** GET /api/community/categories — list active discussion categories. */
export async function GET() {
  try {
    const categories = await getAfnDiscussionCategories(true);
    return NextResponse.json(categories);
  } catch (e) {
    console.error("GET community categories error:", e);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
