import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { createEmailHubAsset } from "@server/services/emailHub/emailHubService";
import { requireEmailHubSession } from "../../lib/session";

const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
]);

/** POST multipart field "file" — stores under public/uploads/email-hub and creates email_hub_assets row */
export async function POST(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 });
  }
  const file = form.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Expected multipart field "file"' }, { status: 400 });
  }
  const mime = file.type || "application/octet-stream";
  if (!ALLOWED.has(mime)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = mime.includes("svg") ? "svg" : mime.includes("png") ? "png" : mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : mime.includes("webp") ? "webp" : mime.includes("gif") ? "gif" : "bin";
  const name = String(form.get("name") ?? "upload").replace(/[^\w\-.\s]/g, "").slice(0, 120) || "upload";
  const uuid = randomUUID();
  const relDir = path.join("public", "uploads", "email-hub", String(user.id));
  const filename = `${uuid}.${ext}`;
  const diskPath = path.join(process.cwd(), relDir, filename);
  await mkdir(path.dirname(diskPath), { recursive: true });
  await writeFile(diskPath, buf);

  const publicPath = `/uploads/email-hub/${user.id}/${filename}`;
  const altText = form.get("altText") != null ? String(form.get("altText")) : null;
  const category = form.get("category") != null ? String(form.get("category")) : "general";

  const row = await createEmailHubAsset({
    ownerUserId: user.id,
    name,
    fileUrl: publicPath,
    mimeType: mime,
    altText,
    tags: [],
    category,
  });

  return NextResponse.json(row);
}
