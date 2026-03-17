import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { optimizeImageBuffer } from "@server/services/imageOptimization";

export const dynamic = "force-dynamic";

/** POST /api/admin/images/save-from-url — fetch image from URL, optimize, and save to public/uploads. Body: { url }. Returns { url: "/uploads/..." }. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const imageUrl = typeof body.url === "string" ? body.url.trim() : "";
    if (!imageUrl || (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://"))) {
      return NextResponse.json({ error: "Valid url (http/https) required." }, { status: 400 });
    }
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch image from URL." }, { status: 400 });
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "URL did not return an image." }, { status: 400 });
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large (max 10MB)." }, { status: 400 });
    }
    const { buffer, ext } = await optimizeImageBuffer(buf, contentType);
    const filename = `${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url, filename });
  } catch (error: unknown) {
    console.error("Save-from-URL error:", error);
    return NextResponse.json({ error: "Failed to save image" }, { status: 500 });
  }
}
