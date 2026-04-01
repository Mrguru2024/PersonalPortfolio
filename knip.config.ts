import type { KnipConfig } from "knip";

/**
 * Knip: unused files / exports / deps. Run: DATABASE_URL=postgresql://u:p@localhost:5432/db npm run knip
 * (drizzle.config.ts reads DATABASE_URL at load time.)
 */
const config: KnipConfig = {
  /** Express legacy apps are outside the Next.js graph. */
  entry: ["api/index.ts", "server/index.ts"],
  ignore: [
    "scripts/**",
    "drizzle.config.ts",
    "public/generate-static-api.js",
    "public/sw.js",
    "**/*.stories.{ts,tsx}",
    "jest.setup.js",
    "jest.config.cjs",
  ],
  ignoreDependencies: [
    /** `require("compression")` inside server/middleware/vercel-production.ts */
    "compression",
  ],
};

export default config;
