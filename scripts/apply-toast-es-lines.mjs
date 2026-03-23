import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const keysPath = path.join(root, "scripts", "toast-es-key-order.txt");
const linesPath = path.join(root, "scripts", "toast-es-lines.txt");
const outPath = path.join(root, "app", "lib", "i18n", "toastEnglishToSpanish.json");

const keys = fs.readFileSync(keysPath, "utf8").trimEnd().split("\n");
const es = fs.readFileSync(linesPath, "utf8").trimEnd().split(/\r?\n/);

if (keys.length !== es.length) {
  console.error(`Key count ${keys.length} != Spanish line count ${es.length}`);
  process.exit(1);
}

const o = {};
for (let i = 0; i < keys.length; i++) {
  o[keys[i]] = es[i];
}

fs.writeFileSync(outPath, JSON.stringify(o, null, 2) + "\n", "utf8");
console.log(`Wrote ${keys.length} Spanish toast strings`);
