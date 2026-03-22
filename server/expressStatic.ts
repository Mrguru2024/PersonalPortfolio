import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Serves a prebuilt SPA from `dist/public` (dev) or `server/public` (prod) if present.
 * Next.js is the primary app — use `npm run dev` / `npm run build`; this is only for legacy Express.
 */
export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.warn(
      `[express] No static build at ${distPath}. API routes still work. For the web UI use Next.js (\`npm run dev\`).`,
    );
    return;
  }

  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
