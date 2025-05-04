#!/usr/bin/env node

/**
 * Custom build script for static Vercel deployment
 * This runs before the application is deployed to ensure only the frontend is built
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createStaticApiFiles } = require('./vercel-static-api.js');

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
    log('Starting static build process for Vercel deployment');

    // Install dependencies
    log('Installing dependencies...');
    run('npm install');

    // Build frontend only
    log('Building frontend for static deployment...');
    run('vite build');

    // Create static API JSON files for the frontend to consume
    log('Creating static API JSON files...');
    createStaticApiFiles();
    
    // Create a static index.html file that properly redirects all routes to the frontend
    log('Creating static route handling...');
    
    // Check if the index.html has been built properly
    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    if (!fs.existsSync(indexPath)) {
      throw new Error('Build failed: index.html not created');
    }

    // Add a custom 404.html that redirects to index for SPA routing
    const notFoundPath = path.join(process.cwd(), 'dist', '404.html');
    fs.copyFileSync(indexPath, notFoundPath);

    log('Build completed successfully');
  } catch (error) {
    log(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

build();