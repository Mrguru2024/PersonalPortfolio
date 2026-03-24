/**
 * One-off / maintenance: raster OG image for social previews (SVG is often ignored).
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

async function main() {
  const svg = await readFile(svgPath);
  const logo = await sharp(svg)
    .resize(720, 360, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  await sharp({
    create: { width: W, height: H, channels: 4, background: bg },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(outPath);

  console.log("Wrote", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
