/**
 * Custom build script for Vercel static deployment
 * This script:
 * 1. Builds the Vite frontend
 * 2. Creates static JSON API files
 * 3. Sets up SPA routing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`[vercel-build-static] ${message}`);
}

function run(command) {
  log(`Running: ${command}`);
  execSync(command, { stdio: 'inherit' });
}

// Create necessary directories
function createDirs() {
  log('Creating directories...');
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }
  if (!fs.existsSync('dist/api')) {
    fs.mkdirSync('dist/api');
  }
}

// Build the frontend with Vite
function buildFrontend() {
  log('Building frontend...');
  run('vite build');
}

// Generate static API JSON files
function generateStaticApiFiles() {
  log('Generating static API files...');
  require('./vercel-static-api.cjs');
}

// Create SPA routing support
function setupSpaRouting() {
  log('Setting up SPA routing...');
  // Copy index.html to 404.html for client-side routing
  if (fs.existsSync('dist/index.html')) {
    fs.copyFileSync('dist/index.html', 'dist/404.html');
    log('Created 404.html for SPA routing');
  }
}

async function build() {
  try {
    log('Starting static build process');
    createDirs();
    buildFrontend();
    generateStaticApiFiles();
    setupSpaRouting();
    log('Static build completed successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();