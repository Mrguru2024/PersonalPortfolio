/**
 * Seed runner: runs the database seed logic in server/seed.ts.
 * Use: npx tsx scripts/seed.ts
 * Or:  npm run db:seed  (runs server/seed.ts directly)
 */
import { spawnSync } from "child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const seedPath = path.join(root, "server", "seed.ts");

const result = spawnSync("npx", ["tsx", seedPath], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
