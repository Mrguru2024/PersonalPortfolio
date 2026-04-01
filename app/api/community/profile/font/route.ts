import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_EXT = new Set([".woff2", ".woff", ".ttf", ".otf"]);
const ALLOWED_TYPES = new Set([
  "font/woff2",
  "font/woff",
  "font/ttf",
  "font/otf",
  "application/font-woff",
  "application/font-woff2",
  "application/x-font-ttf",
  "application/x-font-otf",
  "application/octet-stream",
]);

function extFromName(name: string): string {
  const lower = name.toLowerCase();
  const m = lower.match(/(\.[a-z0-9]+)$/);
  return m?.[1] ?? "";
}

/**
 * POST /api/community/profile/font — upload a webfont for the signed-in user’s public profile.
 * FormData: `file` (woff2/woff/ttf/otf, max 2MB). Optional `fontFamily` hint (not applied server-side).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(user.id);
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided. Use form field \"file\"." }, { status: 400 });
    }
    const ext = extFromName(file.name);
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json(
        { error: "Unsupported extension. Use .woff2, .woff, .ttf, or .otf." },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.has(file.type) && file.type !== "") {
      return NextResponse.json({ error: "Unsupported file type for fonts." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large. Max 2MB." }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (buffer.length < 8) {
      return NextResponse.json({ error: "Invalid font file." }, { status: 400 });
    }
    const woff2 = buffer[0] === 0x77 && buffer[1] === 0x4f && buffer[2] === 0x46 && buffer[3] === 0x32;
    const woff =
      buffer[0] === 0x77 && buffer[1] === 0x4f && buffer[2] === 0x46 && buffer[3] === 0x46;
    if (ext === ".woff2" && !woff2) {
      return NextResponse.json({ error: "File is not a valid WOFF2 font." }, { status: 400 });
    }
    if (ext === ".woff" && !woff) {
      return NextResponse.json({ error: "File is not a valid WOFF font." }, { status: 400 });
    }

    const filename = `profile-font-${userId}-${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profile-fonts");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);
    const url = `/uploads/profile-fonts/${filename}`;

    return NextResponse.json({ url, ext });
  } catch (e) {
    console.error("POST community profile font error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
