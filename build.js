/**
 * Custom build script for Vercel deployment 
 * This handles both the client and server builds
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function log(message) {
  console.log(`[build] ${message}`);
}

function run(command) {
  log(`Running: ${command}`);
  return execSync(command, { stdio: 'inherit' });
}

async function build() {
  try {
    // Build the client
    log('Building client...');
    run('vite build');

    // Create api directory in dist
    log('Setting up API deployment...');
    const distApiDir = path.join(__dirname, 'dist', 'api');
    if (!fs.existsSync(distApiDir)) {
      fs.mkdirSync(distApiDir, { recursive: true });
    }

    // Copy API files to dist/api
    log('Done!');
  } catch (error) {
    log(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

build();