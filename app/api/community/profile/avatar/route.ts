import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { setAfnProfileAvatarUrl } from "@server/afnStorage";
import { storage } from "@server/storage";
import { optimizeProfileAvatarBuffer } from "@server/services/imageOptimization";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];

/**
 * POST /api/community/profile/avatar — upload profile photo for the signed-in user.
 * FormData field: "file". Saves under /uploads/avatars/, updates AFN profile and users.avatar_url.
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
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid type. Allowed: JPEG, PNG, GIF, WebP, AVIF." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);
    const { buffer, ext } = await optimizeProfileAvatarBuffer(inputBuffer, file.type);
    const filename = `profile-${userId}-${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);
    const url = `/uploads/avatars/${filename}`;

    const profile = await setAfnProfileAvatarUrl(userId, url);
    await storage.updateUser(userId, { avatarUrl: url });

    return NextResponse.json({ url, profile });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    if (msg.includes("Unsupported image")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error("POST community profile avatar error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
