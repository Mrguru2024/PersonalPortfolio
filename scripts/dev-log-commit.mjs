#!/usr/bin/env node
/**
 * Appends a short entry to content/development-updates.md after a local git commit.
 *
 * Skips: CI, SKIP_DEV_LOG_COMMIT=1, merge commits, duplicate of same commit hash in file.
 * Leaves the file modified (unstaged) — stage and amend or commit as you prefer.
 *
 * Hook: installed by scripts/install-git-hooks.mjs (npm install / npm run dev:install-hooks).
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const DOC = join(ROOT, "content", "development-updates.md");

/** Apply SKIP_* / ASCENDRA_* from .env.local when not already in process.env (helps Windows shells). */
function applyLocalEnvOverrides() {
  const p = join(ROOT, ".env.local");
  if (!existsSync(p)) return;
  let text;
  try {
    text = readFileSync(p, "utf8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key === "SKIP_DEV_LOG_COMMIT" && process.env.SKIP_DEV_LOG_COMMIT === undefined) {
      process.env.SKIP_DEV_LOG_COMMIT = val;
    }
    if (key === "ASCENDRA_DEV_LOG_COMMITS" && process.env.ASCENDRA_DEV_LOG_COMMITS === undefined) {
      process.env.ASCENDRA_DEV_LOG_COMMITS = val;
    }
    if (key === "ASCENDRA_DEV_LOG_QUIET" && process.env.ASCENDRA_DEV_LOG_QUIET === undefined) {
      process.env.ASCENDRA_DEV_LOG_QUIET = val;
    }
  }
}

applyLocalEnvOverrides();

function sh(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8", cwd: ROOT }).trim();
}

function skip(reason) {
  if (process.env.ASCENDRA_DEV_LOG_QUIET !== "1") {
    console.log(`[dev-log-commit] skip: ${reason}`);
  }
  process.exit(0);
}

if (process.env.CI === "true" || process.env.CI === "1") {
  skip("CI");
}
if (process.env.SKIP_DEV_LOG_COMMIT === "1") {
  skip("SKIP_DEV_LOG_COMMIT");
}
if (process.env.ASCENDRA_DEV_LOG_COMMITS === "0" || process.env.ASCENDRA_DEV_LOG_COMMITS === "false") {
  skip("ASCENDRA_DEV_LOG_COMMITS disabled");
}

if (!existsSync(join(ROOT, ".git"))) {
  skip("not a git checkout");
}
if (!existsSync(DOC)) {
  skip("content/development-updates.md missing");
}

let mergeParents;
try {
  mergeParents = sh("git", ["log", "-1", "--format=%P"]);
} catch {
  skip("git log failed");
}
if (mergeParents.includes(" ")) {
  skip("merge commit");
}

let hash;
let subject;
try {
  hash = sh("git", ["rev-parse", "HEAD"]);
  subject = sh("git", ["log", "-1", "--format=%s"]);
} catch {
  skip("git rev-parse / log failed");
}

const short = hash.slice(0, 7);
if (!hash || !subject) {
  skip("empty commit metadata");
}

const raw = readFileSync(DOC, "utf8");
if (raw.includes(`\`${short}\``)) {
  skip("commit already listed in development-updates.md");
}

const now = new Date();
const y = now.getFullYear();
const mo = String(now.getMonth() + 1).padStart(2, "0");
const d = String(now.getDate()).padStart(2, "0");
const h = String(now.getHours()).padStart(2, "0");
const mi = String(now.getMinutes()).padStart(2, "0");
const dateLine = `${y}-${mo}-${d} ${h}:${mi}`;

const safeSubject = subject.replace(/`/g, "'").slice(0, 120);
const title = `Auto · ${short}`;
const block = `## ${dateLine} — ${title}

- \`${safeSubject}\` (\`${short}\`)

---

`;

const lines = raw.split("\n");
let insertAt = 0;
while (insertAt < lines.length && !lines[insertAt].startsWith("## ")) {
  insertAt += 1;
}
if (insertAt >= lines.length) {
  writeFileSync(DOC, `${raw.trimEnd()}\n\n${block}`, "utf8");
} else {
  const next = [...lines.slice(0, insertAt), ...block.trimEnd().split("\n"), "", ...lines.slice(insertAt)];
  writeFileSync(DOC, next.join("\n"), "utf8");
}

console.log(
  `[dev-log-commit] appended ${short} to content/development-updates.md (unstaged). Stage and commit or amend when ready.`,
);
