/**
 * Type definitions for server/vite.ts
 * This is used to help TypeScript compilation on Vercel
 */
import { Express } from "express";
import { Server } from "http";

// Export the same functions as the actual vite.ts but with simplified types
export function log(message: string, source?: string): void;
export function setupVite(app: Express, server: Server): Promise<void>;
export function serveStatic(app: Express): void;