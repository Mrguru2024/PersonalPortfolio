import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const files = ["ascendra-logo.svg", "favicon.svg"];

for (const file of files) {
  const filepath = path.join(publicDir, file);
  if (!fs.existsSync(filepath)) {
    console.log("Skip (not found):", file);
    continue;
  }
  let s = fs.readFileSync(filepath, "utf8");
  // Add transparent background to root SVG so browsers/social don't show white/black
  if (s.includes('style="background') || s.includes("style='background")) {
    console.log("Already has background style:", file);
    continue;
  }
  // Insert after opening <svg (first space after "svg")
  s = s.replace(/<svg (?=xmlns)/, '<svg style="background-color:transparent;background:transparent" ');
  fs.writeFileSync(filepath, s, "utf8");
  console.log("Updated:", file);
}
