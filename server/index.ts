import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer as createViteServer } from 'vite';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Logger function
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Setup the Vite middleware
async function setupVite(app: express.Express, server: any) {
  log("Setting up Vite middleware...", "vite");
  
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: path.resolve(__dirname, '..', 'client'),
    base: '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '..', 'client', 'src'),
        '@shared': path.resolve(__dirname, '..', 'shared'),
      }
    }
  });

  // Use Vite's middleware
  app.use(vite.middlewares);

  log("Vite middleware setup complete", "vite");
  return vite;
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
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
  // Create an HTTP server
  const server = await registerRoutes(app);

  // Set up the Vite middleware for development
  const vite = await setupVite(app, server);

  // Add error handler middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Catch-all handler for serving the client-side app
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    
    // Skip API requests - those are handled by Express
    if (url.startsWith('/api')) {
      return next();
    }
    
    try {
      // Read the index.html as a string
      let template = await fs.readFile(
        path.resolve(__dirname, '../client/index.html'),
        'utf-8'
      );
      
      // Apply Vite transformations
      template = await vite.transformIndexHtml(url, template);
      
      // Serve the transformed HTML
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      log(`Error handling request: ${e}`, "express");
      vite.ssrFixStacktrace(e as Error);
      res.status(500).end('Internal Server Error');
      next(e);
    }
  });

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server running at http://0.0.0.0:${port}`);
  });

  // Handle shutdown properly
  process.on('SIGINT', () => {
    log("Shutting down server...");
    process.exit();
  });
})();
