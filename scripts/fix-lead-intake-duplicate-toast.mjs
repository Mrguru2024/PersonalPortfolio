/**
 * Replaces merged duplicate title/description in lead-intake toast (TS build fix).
 * Idempotent: no-op if pattern is absent.
 */
import fs from "node:fs";

const path = process.argv[2] ?? "app/admin/lead-intake/page.tsx";
let s = fs.readFileSync(path, "utf8");

const bad =
  /    if \(useAi && !aiConfigured\) \{\s*toast\(\{\s*title: "AI not configured",\s*description: "AI import is currently unavailable\. Import without AI to continue\.",\s*title: "Enhanced import unavailable",\s*description: "Use standard import for now or enable enhanced import in settings\.",\s*variant: "destructive",\s*\}\);\s*return;\s*\}/s;

const good = `    if (useAi && !aiConfigured) {
      toast({
        title: "Enhanced import unavailable",
        description:
          "AI isn\u2019t configured, so enhanced import isn\u2019t available. Use standard import or enable it in settings.",
        variant: "destructive",
      });
      return;
    }`;

if (!bad.test(s)) {
  process.stdout.write(`skip: pattern not in ${path}\n`);
  process.exit(0);
}

s = s.replace(bad, good);
fs.writeFileSync(path, s);
process.stdout.write(`fixed: ${path}\n`);
