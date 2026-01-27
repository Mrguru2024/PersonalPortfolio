import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { config } from "dotenv";
import { resolve } from "path";

// Force NODE_ENV to development for local dev server (unless explicitly set to production)
// This ensures Vite is used instead of static file serving
// NODE_ENV is read-only in newer Node.js versions, so we don't set it here
// It should be set via environment variables or build scripts

// Load environment variables from .env.local for local development
// Note: This will load other vars but NODE_ENV is already set above
if (process.env.NODE_ENV === "development") {
  config({ path: resolve(process.cwd(), ".env.local") });
  // NODE_ENV is read-only in newer Node.js versions
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    try {
      await setupVite(app, server);
      log("Vite development server initialized");
    } catch (error: any) {
      log(`Warning: Could not setup Vite: ${error.message}. API will still work, but frontend may not be available.`);
      log("To fix: npm install @vitejs/plugin-react");
      // Continue without Vite - API routes will still work
    }
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  // Use localhost on Windows, 0.0.0.0 on Unix-like systems
  const host = process.platform === "win32" ? "localhost" : "0.0.0.0";
  server.listen(port, host, () => {
    log(`serving on ${host}:${port}`);
  });
})();
