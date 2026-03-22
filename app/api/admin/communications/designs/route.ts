import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const designs = await storage.listCommEmailDesigns();
    return NextResponse.json(designs);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to list designs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const htmlContent = typeof body.htmlContent === "string" ? body.htmlContent : "";
    if (!name || !subject || !htmlContent) {
      return NextResponse.json({ error: "name, subject, and htmlContent are required" }, { status: 400 });
    }
    const row = await storage.createCommEmailDesign({
      name,
      subject,
      previewText: typeof body.previewText === "string" ? body.previewText : null,
      htmlContent,
      plainText: typeof body.plainText === "string" ? body.plainText : null,
      blocksJson: Array.isArray(body.blocksJson) ? body.blocksJson : null,
      category: typeof body.category === "string" ? body.category : "general",
      personaIdsJson: Array.isArray(body.personaIdsJson) ? body.personaIdsJson.map(String) : [],
      senderName: typeof body.senderName === "string" ? body.senderName : null,
      status: body.status === "published" ? "published" : "draft",
      createdBy: user?.id ?? null,
    });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create design" }, { status: 500 });
  }
}
