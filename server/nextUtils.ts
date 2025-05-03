import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Initialize Next.js and set up for Express
export async function setupNext(app: Express) {
  try {
    await nextApp.prepare();
    log("Next.js initialized", "next");
    
    // Set up a wildcard handler for all non-API routes to be handled by Next.js
    app.all('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        return handle(req, res);
      }
    });
    
    return nextApp;
  } catch (error) {
    console.error("Error setting up Next.js:", error);
    throw error;
  }
}

// Simple static file server for Next.js public folder
export function serveStatic(app: Express) {
  const publicPath = path.resolve(process.cwd(), "public");

  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    log(`Serving static files from ${publicPath}`);
  }
}