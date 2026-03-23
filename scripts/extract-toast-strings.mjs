import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "app");
const strings = new Set();

function extractFromToastBlocks(src) {
  let searchFrom = 0;
  while (true) {
    const t = src.indexOf("toast({", searchFrom);
    if (t === -1) break;
    const open = src.indexOf("{", t + 5);
    if (open === -1) break;
    let depth = 0;
    let i = open;
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          const block = src.slice(open, i + 1);
          const re = /\b(?:title|description):\s*"((?:\\.|[^"\\])*)"/g;
          let m;
          while ((m = re.exec(block))) {
            try {
              strings.add(JSON.parse(`"${m[1]}"`));
            } catch {
              strings.add(m[1]);
            }
          }
          searchFrom = i + 1;
          break;
        }
      }
    }
    if (i >= src.length) break;
  }
}

function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p);
    else if (name.name.endsWith(".tsx") || name.name.endsWith(".ts")) {
      const src = fs.readFileSync(p, "utf8");
      if (!src.includes("toast({")) continue;
      extractFromToastBlocks(src);
    }
  }
}

walk(root);
console.log([...strings].sort().join("\n"));
