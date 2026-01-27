import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Lazy import vite config to avoid loading it during server startup
  // This prevents errors if vite dependencies aren't available
  let viteConfig: any = {};
  try {
    const configModule = await import("../vite.config");
    viteConfig = configModule.default || {};
  } catch (error: any) {
    console.warn(
      `[Vite] Could not load vite.config.ts: ${error.message}. ` +
      `Using default Vite configuration. ` +
      `You may need to install missing dependencies: npm install @vitejs/plugin-react`
    );
    // Use minimal default config
    viteConfig = {
      root: path.resolve(import.meta.dirname, "..", "client"),
      plugins: [],
    };
  }
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In development, try dist/public, in production use the correct path
  const distPath = process.env.NODE_ENV === "development"
    ? path.resolve(import.meta.dirname, "..", "dist", "public")
    : path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.warn(
      `Warning: Could not find the build directory: ${distPath}. ` +
      `Skipping static file serving. ` +
      `In development mode, Vite will handle serving. ` +
      `In production, make sure to build the client first with 'npm run build'.`
    );
    // Don't throw - just skip static file serving
    // In development, Vite will handle it. In production, this is a warning.
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
