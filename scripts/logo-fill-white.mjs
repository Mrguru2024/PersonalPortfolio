import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(__dirname, "..", "public", "ascendra-logo.svg");

let s = fs.readFileSync(logoPath, "utf8");

// Replace all fill="<anything>" with fill="#ffffff"
s = s.replace(/fill="[^"]*"/g, 'fill="#ffffff"');

// Replace all stroke="<anything>" with stroke="#ffffff" (text outlines / paths)
s = s.replace(/stroke="[^"]*"/g, 'stroke="#ffffff"');

// Replace fill and stroke inside style="..." (e.g. style="fill:#000;stroke:black")
s = s.replace(/(\bfill:\s*)([^;}+"']+)/g, "$1#ffffff");
s = s.replace(/(\bstroke:\s*)([^;}+"']+)/g, "$1#ffffff");

// color: in style (can affect text)
s = s.replace(/(\bcolor:\s*)([^;}+"']+)/g, "$1#ffffff");

fs.writeFileSync(logoPath, s, "utf8");
console.log("Updated ascendra-logo.svg: all fill, stroke, and color set to white (#ffffff).");
