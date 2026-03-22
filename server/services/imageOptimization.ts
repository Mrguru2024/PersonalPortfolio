/**
 * Server-side image optimization: resize and convert to WebP for smaller file size
 * while keeping visual quality. Used by upload and save-from-URL APIs.
 */

import sharp from "sharp";

const MAX_WIDTH = 2560;
const MAX_HEIGHT = 2560;
const WEBP_QUALITY = 82;

/**
 * Optimize image buffer: resize if larger than max dimensions, convert to WebP.
 * Returns optimized buffer and extension ".webp".
 * Non-image or unsupported formats are returned as-is (buffer and original ext).
 */
export async function optimizeImageBuffer(
  input: Buffer,
  originalMime?: string
): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
  const supported = /^image\/(jpeg|png|gif|webp|avif)$/i.test(originalMime ?? "");
  if (!supported) {
    return { buffer: input, ext: ".bin", contentType: originalMime ?? "application/octet-stream" };
  }

  try {
    let pipeline = sharp(input);
    const metadata = await pipeline.metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    const needsResize = width > MAX_WIDTH || height > MAX_HEIGHT;
    if (needsResize) {
      pipeline = pipeline.resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    const out = await pipeline
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer();

    return { buffer: out, ext: ".webp", contentType: "image/webp" };
  } catch (err) {
    console.warn("Image optimization failed, using original:", err);
    const ext =
      originalMime === "image/png"
        ? ".png"
        : originalMime === "image/gif"
          ? ".gif"
          : originalMime === "image/webp"
            ? ".webp"
            : ".jpg";
    return { buffer: input, ext, contentType: originalMime ?? "image/jpeg" };
  }
}

const PROFILE_AVATAR_PX = 512;

/**
 * Square crop (attention), WebP — for member profile photos.
 */
export async function optimizeProfileAvatarBuffer(
  input: Buffer,
  originalMime?: string
): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
  const supported = /^image\/(jpeg|png|gif|webp|avif)$/i.test(originalMime ?? "");
  if (!supported) {
    throw new Error("Unsupported image type for profile photo");
  }
  const out = await sharp(input)
    .rotate()
    .resize(PROFILE_AVATAR_PX, PROFILE_AVATAR_PX, {
      fit: "cover",
      position: "attention",
    })
    .webp({ quality: 86, effort: 4 })
    .toBuffer();
  return { buffer: out, ext: ".webp", contentType: "image/webp" };
}
