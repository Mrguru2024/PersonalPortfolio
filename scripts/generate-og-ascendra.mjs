/**
 * One-off / maintenance: raster OG image for social previews (SVG is often ignored).
 * Logo + site name + tagline so link previews read clearly even when cropped.
 * Run: node scripts/generate-og-ascendra.mjs
 */
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const W = 1200;
const H = 630;
const root = join(process.cwd(), "public");
const svgPath = join(root, "ascendra-logo.svg");
const outPath = join(root, "og-ascendra.png");

// Ascendra brand navy #0B1142
const bg = { r: 11, g: 17, b: 66, alpha: 1 };

const textSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <text x="600" y="520" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="44" font-weight="700" fill="#ffffff">Ascendra Technologies</text>
  <text x="600" y="572" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="26" font-weight="400" fill="rgba(255,255,255,0.9)">Brand strategy, websites &amp; marketing — one team</text>
</svg>`;

async function main() {
  const svg = await readFile(svgPath);
  const logo = await sharp(svg)
    .resize(520, 260, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  const { width: lw = 0 } = await sharp(logo).metadata();
  const logoLeft = Math.max(0, Math.round((W - lw) / 2));

  const textLayer = await sharp(Buffer.from(textSvg)).png().toBuffer();

  await sharp({
    create: { width: W, height: H, channels: 4, background: bg },
  })
    .composite([
      { input: logo, top: 96, left: logoLeft },
      { input: textLayer, left: 0, top: 0 },
    ])
    .png()
    .toFile(outPath);

  console.log("Wrote", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
