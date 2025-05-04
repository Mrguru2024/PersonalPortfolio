// This script will be used to shift from Express+Vite to Next.js without changing workflows
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔄 Activating Next.js application...');

// Kill any existing Express process (this won't kill our parent process)
try {
  console.log('🛑 Stopping any running Express processes...');
  execSync('pkill -f "tsx server/index.ts" || true');
  console.log('✅ Express stopped successfully');
} catch (error) {
  console.log('⚠️ No Express processes found to stop');
}

// Start Next.js with the .mjs config
console.log('🚀 Starting Next.js...');
const nextProcess = spawn('npx', ['next', 'dev', '-p', '3000'], {
  env: { 
    ...process.env,
    NEXTJS_CONFIG_PATH: 'next.config.mjs',
    NODE_OPTIONS: '--experimental-loader=ts-node/esm'
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