/**
 * Script to start the Next.js version of the portfolio
 */

const { exec } = require('child_process');
const path = require('path');

// Kill any running Express server
console.log('Stopping Express server if running...');
exec('pkill -f "tsx server/index.ts" || true', (error) => {
  if (error) {
    console.error('Error stopping Express server:', error);
  } else {
    console.log('✅ Express server stopped or was not running');
  }

  // Start the Next.js server
  console.log('Starting Next.js server...');
  const nextProcess = exec('npm run next:dev', {
    env: { ...process.env, PORT: 3000 }
  });

  nextProcess.stdout.on('data', (data) => {
    console.log(data);
  });

  nextProcess.stderr.on('data', (data) => {
    console.error(`Next.js Error: ${data}`);
  });

  nextProcess.on('close', (code) => {
    console.log(`Next.js server exited with code ${code}`);
  });
});