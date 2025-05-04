import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// This is a placeholder for the old setupVite function
// It now points to Next.js app directory 
export async function setupVite(app: Express, server: Server) {
  // Instead of Vite middleware, just serve a message directing to Next.js
  app.use("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      res.status(404).json({ message: "API endpoint not found" });
    } else {
      res.status(200).send(`
        <html>
          <head>
            <title>Migrating to Next.js</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 2rem;
                line-height: 1.6;
              }
              h1 { color: #0070f3; }
              .container { 
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                text-align: center;
              }
              .card {
                background: white;
                border-radius: 8px;
                padding: 2rem;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <h1>Migrating to Next.js</h1>
                <p>This application is being migrated from Vite to Next.js.</p>
                <p>Please use the Next.js development server instead by running: <code>npx next dev</code></p>
                <p>API endpoints will continue to work through Next.js API routes.</p>
              </div>
            </div>
          </body>
        </html>
      `);
    }
  });
}

export function serveStatic(app: Express) {
  const nextPublicPath = path.resolve(import.meta.dirname, "..", ".next", "static");
  
  if (fs.existsSync(nextPublicPath)) {
    app.use("/_next/static", express.static(nextPublicPath));
  }
  
  // Redirect all other requests to the Next.js server
  app.use("*", (_req, res) => {
    res.redirect("/");
  });
}