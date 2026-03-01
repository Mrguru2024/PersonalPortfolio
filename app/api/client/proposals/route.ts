import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Sign in to view your proposals" }, { status: 401 });
    }

    const email = user.email?.trim();
    const byUserId = await storage.getClientQuotes(user.id);
    const byEmail = email ? await storage.getClientQuotesByEmail(email) : [];
    const seen = new Set<number>();
    const combined = [...byUserId];
    byEmail.forEach((q) => {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        combined.push(q);
      }
    });
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(combined);
  } catch (error: any) {
    console.error("Client proposals list error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load proposals" },
      { status: 500 }
    );
  }
}
