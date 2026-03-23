import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/agent/knowledge — list this admin's knowledge entries. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const userId = user?.id != null ? Number(user.id) : null;
    if (userId == null) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }
    const rows = await storage.listAdminAgentKnowledgeEntries(userId);
    return NextResponse.json({ entries: rows });
  } catch (e) {
    console.error("GET admin agent knowledge error:", e);
    return NextResponse.json({ message: "Failed to load entries" }, { status: 500 });
  }
}

/** POST /api/admin/agent/knowledge — create an entry. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const userId = user?.id != null ? Number(user.id) : null;
    if (userId == null) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
    const bodyText = typeof body.body === "string" ? body.body.trim().slice(0, 50_000) : "";
    if (!title || !bodyText) {
      return NextResponse.json({ message: "title and body are required" }, { status: 400 });
    }
    const useInAgent = body.useInAgent !== false;
    const useInResearch = body.useInResearch !== false;
    const useInMessages = body.useInMessages === true;
    const row = await storage.createAdminAgentKnowledgeEntry({
      userId,
      title,
      body: bodyText,
      useInAgent,
      useInResearch,
      useInMessages,
    });
    return NextResponse.json({ entry: row });
  } catch (e) {
    console.error("POST admin agent knowledge error:", e);
    return NextResponse.json({ message: "Failed to create entry" }, { status: 500 });
  }
}
