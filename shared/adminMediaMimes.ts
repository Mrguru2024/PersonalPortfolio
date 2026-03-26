/**
 * Admin upload MIME → extension (no leading dot). Used by brand vault, /api/upload, funnel assets, etc.
 */

export const ADMIN_VIDEO_MIME_TO_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "video/ogg": "ogv",
  "video/3gpp": "3gp",
  "video/x-matroska": "mkv",
  "video/x-ms-wmv": "wmv",
};

/** Browser `accept` for rich editor / generic media pickers (images + common video). */
export const ADMIN_RICH_MEDIA_FILE_ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  ...Object.keys(ADMIN_VIDEO_MIME_TO_EXT),
].join(",");

export const MAX_ADMIN_INLINE_UPLOAD_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_ADMIN_INLINE_UPLOAD_VIDEO_BYTES = 80 * 1024 * 1024;

export function extForAdminVideoMime(mime: string): string | undefined {
  return ADMIN_VIDEO_MIME_TO_EXT[mime];
}
