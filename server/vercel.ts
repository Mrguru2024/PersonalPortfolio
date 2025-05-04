/**
 * This file is specifically for Vercel deployment
 * It provides a more robust production server setup
 */

import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { setupVercelMiddleware } from "./middleware/vercel-production";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Apply Vercel-specific production optimizations
setupVercelMiddleware(app);

// Production logging middleware
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

      console.log(`[vercel] ${logLine}`);
    }
  });

  next();
});

// CORS for Vercel preview deployments
app.use((req, res, next) => {
  // Add Vercel specific CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Setup all API routes from the routes.ts file
async function setupServer() {
  const server = await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[vercel] Error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Serve static files in production
  const distPath = path.resolve(process.cwd(), 'dist', 'public');
  
  if (fs.existsSync(distPath)) {
    console.log(`[vercel] Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    
    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  } else {
    console.warn(`[vercel] Warning: Build directory ${distPath} not found`);
  }

  const port = process.env.PORT || 5000;
  server.listen(port, () => {
    console.log(`[vercel] Server running on port ${port}`);
  });

  return server;
}

setupServer().catch(err => {
  console.error('[vercel] Failed to start server:', err);
  process.exit(1);
});

export default app;