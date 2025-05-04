// This script is a simpler version that just starts Next.js directly
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Next.js with our configuration...');

// Start Next.js with the .mjs config file
const nextProcess = spawn('npx', ['next', 'dev', '-p', '3000'], {
  env: { 
    ...process.env,
    NEXTJS_CONFIG_PATH: 'next.config.mjs'
  },
  stdio: 'inherit'
});

nextProcess.on('error', (error) => {
  console.error('❌ Failed to start Next.js:', error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  nextProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  nextProcess.kill('SIGTERM');
  process.exit(0);
});