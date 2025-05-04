// This is a simple script to run Next.js directly
// Run with: node run-next.js

const { execSync } = require('child_process');

console.log('Starting Next.js development server...');
try {
  execSync('npx next dev -p 3000', { stdio: 'inherit' });
} catch (error) {
  console.error('Error starting Next.js:', error.message);
}