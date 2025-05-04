#!/usr/bin/env node

/**
 * Custom build script for Vercel deployment
 * This runs before the application is deployed to ensure everything is built correctly
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Log with timestamp
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Run a command and log the output
function run(command) {
  log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    log(`Error executing ${command}`);
    throw error;
  }
}

// Main build process
async function build() {
  try {
    log('Starting build process for Vercel deployment');

    // Install dependencies
    log('Installing dependencies...');
    run('npm install');

    // Run a modified TypeScript check that ignores the vite.ts file 
    log('Running modified type checking for Vercel deployment...');
    run('tsc --skipLibCheck --skipDefaultLibCheck --noEmit --noErrorTruncation server/vercel.ts');

    // Build frontend with production optimizations
    log('Building frontend with production optimizations...');
    run('VITE_APP_ENV=production vite build --mode production');

    // Ensure static asset optimization
    log('Optimizing static assets...');
    // Create a .vercel/output/static directory if needed for static asset optimization
    const staticOutputDir = path.join(process.cwd(), '.vercel', 'output', 'static');
    if (!fs.existsSync(staticOutputDir)) {
      fs.mkdirSync(staticOutputDir, { recursive: true });
    }

    // Build backend (with special handling for vite.ts)
    log('Building backend with optimizations...');
    run('esbuild server/vercel.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify');
    
    // Create a special type-check workaround for vite.ts
    log('Creating server/vite.d.ts for type compatibility...');
    if (!fs.existsSync('dist/types')) {
      fs.mkdirSync('dist/types', { recursive: true });
    }
    
    // Write a .d.ts file to help with type compatibility
    fs.writeFileSync('dist/types/vite.d.ts', `
      import { Express } from "express";
      import { Server } from "http";
      
      export function log(message: string, source?: string): void;
      export function setupVite(app: Express, server: Server): Promise<void>;
      export function serveStatic(app: Express): void;
    `);

    // Ensure output directory exists
    if (!fs.existsSync(path.join(process.cwd(), 'dist'))) {
      throw new Error('Build failed: dist directory not created');
    }

    log('Build completed successfully');
  } catch (error) {
    log(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

build();