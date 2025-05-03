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

    // Build Next.js app
    log('Building Next.js application...');
    run('next build');
    
    // No need to build backend separately with Next.js
    log('Backend APIs are integrated into Next.js app routes');

    // Ensure Next.js output directory exists
    if (!fs.existsSync(path.join(process.cwd(), '.next'))) {
      throw new Error('Build failed: .next directory not created');
    }

    log('Build completed successfully');
  } catch (error) {
    log(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

build();