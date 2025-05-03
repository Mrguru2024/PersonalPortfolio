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

    // Check TypeScript compilation
    log('Type checking...');
    run('npm run check');

    // Build frontend
    log('Building frontend...');
    run('vite build');

    // Build backend
    log('Building backend...');
    run('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist');

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