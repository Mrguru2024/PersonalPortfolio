import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@server/db";
import { websiteAudits } from "@shared/schema";

export const dynamic = "force-dynamic";

function isMissingTableError(error: unknown): boolean {
  const msg = String(error instanceof Error ? error.message : error).toLowerCase();
  return msg.includes("website_audits") || (msg.includes("relation") && msg.includes("does not exist"));
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const items = await db
      .select()
      .from(websiteAudits)
      .orderBy(desc(websiteAudits.id));

    return NextResponse.json({ items, missingTable: false });
  } catch (error: unknown) {
    if (isMissingTableError(error)) {
      return NextResponse.json({
        items: [],
        missingTable: true,
        message:
          "website_audits table is missing. Run `npm run db:push` to create it.",
      });
    }
    console.error("Error fetching website audits:", error);
    return NextResponse.json(
      { error: "Failed to fetch website audits" },
      { status: 500 }
    );
  }
}
