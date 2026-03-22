/**
 * Ensures `.next/types/routes.d.ts` exists so `tsc` / IDE can resolve
 * `import "./.next/types/routes.d.ts"` from `next-env.d.ts` before the first
 * `next dev` / `next build`. Replaced in full on the next Next.js compile.
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const target = join(root, ".next", "types", "routes.d.ts");
const stub = `// Stub — run \`next dev\` or \`next build\` to regenerate full route types.
export {};
`;

if (!existsSync(target)) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, stub, "utf8");
  console.log("[ensure-next-types] wrote stub:", target);
}
