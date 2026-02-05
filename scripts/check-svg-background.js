import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const publicDir = path.join(__dirname, "..", "public");
const files = ["ascendra-logo.svg", "favicon.svg"];

for (const file of files) {
  const filepath = path.join(publicDir, file);
  if (!fs.existsSync(filepath)) continue;
  const s = fs.readFileSync(filepath, "utf8");
  // Check for rect that might be full-viewbox background
  const rectMatch = s.match(/<rect[^>]*>/g);
  // Check for fill white/black
  const fillWhite = (s.match(/fill="white"|fill="#fff|fill="#ffffff|fill='white'/gi) || []).length;
  const fillBlack = (s.match(/fill="black"|fill="#000|fill="#000000|fill='black'/gi) || []).length;
  // Get viewBox
  const viewBox = s.match(/viewBox="([^"]+)"/);
  console.log(file, "viewBox:", viewBox ? viewBox[1] : "?", "rects:", rectMatch ? rectMatch.length : 0, "fillWhite:", fillWhite, "fillBlack:", fillBlack);
  // Output first 200 chars after </metadata>
  const endMeta = s.indexOf("</metadata>");
  if (endMeta > 0) {
    const after = s.slice(endMeta, endMeta + 400);
    console.log("After metadata:", after.replace(/\s+/g, " ").slice(0, 300));
  }
}
