#!/usr/bin/env node
/**
 * Writes .git/hooks/post-commit to run scripts/dev-log-commit.mjs after each commit.
 * No-op if .git is missing (e.g. npm pack extract). Skips when CI=true to avoid noise in automated installs.
 */

import { writeFileSync, chmodSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

if (process.env.CI === "true" || process.env.CI === "1") {
  process.exit(0);
}

const root = process.cwd();
const gitDir = join(root, ".git");
const hooksDir = join(gitDir, "hooks");
const hookPath = join(hooksDir, "post-commit");

if (!existsSync(gitDir)) {
  process.exit(0);
}
if (!existsSync(hooksDir)) {
  try {
    mkdirSync(hooksDir, { recursive: true });
  } catch {
    process.exit(0);
  }
}

const hook = `#!/bin/sh
# Ascendra — append commit to content/development-updates.md (dev only). Managed by npm run dev:install-hooks / prepare.
cd "$(git rev-parse --show-toplevel)" || exit 0
node scripts/dev-log-commit.mjs || true
`;

writeFileSync(hookPath, hook, "utf8");
try {
  chmodSync(hookPath, 0o755);
} catch {
  /* Windows may ignore chmod */
}

if (process.env.ASCENDRA_DEV_LOG_QUIET !== "1") {
  console.log("[install-git-hooks] post-commit → scripts/dev-log-commit.mjs");
}
