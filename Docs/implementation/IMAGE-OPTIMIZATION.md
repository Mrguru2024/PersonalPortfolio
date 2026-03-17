# Image optimization

Images are optimized for visual quality while keeping file size and load times low.

## On upload / save-from-URL

- **Service**: `server/services/imageOptimization.ts` (sharp)
- **Behavior**: Resize to max 2560×2560 (inside, no upscale), convert to WebP quality 82
- **Used by**: `POST /api/upload`, `POST /api/admin/images/save-from-url`
- Stored files under `public/uploads/` are WebP. Use the returned URL as-is.

## Next.js Image component

- Use `<Image>` from `next/image` for all site images (including `/uploads/...`).
- Next.js serves AVIF/WebP and responsive `srcset`; config in `next.config.js`:
  - `formats: ['image/avif', 'image/webp']`
  - `deviceSizes` / `imageSizes` for responsive widths
  - `minimumCacheTTL: 31536000` (1 year) for stable uploads
- Optional: set `quality={82}` on `<Image>` to match upload quality (default is 75).

## External domains

For images from external URLs, ensure the host is allowed in `next.config.js` → `images.remotePatterns` so Next.js can optimize them.
