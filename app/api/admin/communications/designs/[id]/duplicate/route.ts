import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const id = Number((await params).id);
    const src = await storage.getCommEmailDesignById(id);
    if (!src) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const row = await storage.createCommEmailDesign({
      name: `${src.name} (copy)`,
      subject: src.subject,
      previewText: src.previewText,
      htmlContent: src.htmlContent,
      plainText: src.plainText,
      blocksJson: src.blocksJson ?? null,
      category: src.category,
      personaIdsJson: src.personaIdsJson ?? [],
      senderName: src.senderName,
      status: "draft",
      createdBy: user?.id ?? null,
    });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to duplicate" }, { status: 500 });
  }
}
