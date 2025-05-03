#!/usr/bin/env node

/**
 * This script helps with the migration from the Vite+Express setup to Next.js
 * It builds a new version of the application with Next.js while preserving the existing
 * functionality.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories and files to retain
const RETAIN_DIRS = ['app', 'public', 'client/src/components', 'client/src/hooks', 'client/src/lib', 'client/src/pages', 'client/src/sections', 'shared'];
const RETAIN_FILES = ['package.json', 'tsconfig.json', 'tailwind.config.ts', 'postcss.config.js', 'components.json', 'drizzle.config.ts', 'types'];

// Files to delete (Vite-specific)
const DELETE_FILES = [
  'vite.config.ts',
  'vite.config.ts.bak',
  'server/vite.ts',
  'vercel-build.js',
  'vercel-package.json',
  'vercel.json',
  '.replit',
  'old_index.html'
];

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Copy server routes to Next.js API routes
function migrateServerRoutes() {
  console.log('Migrating server routes to Next.js API routes...');
  
  // Ensure directories exist
  ensureDirectoryExists(path.join(__dirname, '../app/api'));
  
  // We've already created these in the migration process
  console.log('✓ Server routes migrated successfully!');
}

// Update package.json for Next.js
function updatePackageJson() {
  console.log('Updating package.json for Next.js...');
  
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = require(packageJsonPath);
  
  // Update scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
    lint: 'next lint',
    'db:push': 'drizzle-kit push:pg',
  };
  
  // Save the updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  console.log('✓ package.json updated successfully!');
}

// Create or update the Next.js config file
function createNextConfig() {
  console.log('Creating/updating Next.js config...');
  
  const nextConfigPath = path.join(__dirname, '../next.config.mjs');
  const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['avatars.githubusercontent.com', 'github.com', 'mrguru.dev'],
  },
  // Preserve paths from the old Vite setup
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  // Environment variables
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  },
};

export default nextConfig;
`;
  
  fs.writeFileSync(nextConfigPath, nextConfigContent);
  
  console.log('✓ Next.js config created/updated successfully!');
}

// Delete Vite-specific files
function deleteViteFiles() {
  console.log('Deleting Vite-specific files...');
  
  DELETE_FILES.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`✓ Deleted: ${file}`);
      } catch (err) {
        console.error(`Error deleting ${file}:`, err);
      }
    } else {
      console.log(`- File not found: ${file} (already removed)`);
    }
  });
  
  console.log('✓ Vite-specific files deleted successfully!');
}

// Create .env.local file with necessary environment variables
function createEnvFile() {
  console.log('Creating .env.local file...');
  
  const envPath = path.join(__dirname, '../.env.local');
  
  // Check if it already exists
  if (fs.existsSync(envPath)) {
    console.log('- .env.local already exists, not overwriting');
    return;
  }
  
  const envContent = `# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Database
DATABASE_URL=your-database-url-here

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here

# Email
SENDGRID_API_KEY=your-sendgrid-api-key-here
FROM_EMAIL=noreply@mrguru.dev
ADMIN_EMAIL=your-email@example.com
`;
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('✓ .env.local file created successfully!');
}

// Main function to run the migration process
function runMigration() {
  console.log('Starting migration to Next.js...');
  
  // Create or ensure necessary directories
  ensureDirectoryExists(path.join(__dirname, '../public'));
  
  // Migrate server routes to Next.js API routes
  migrateServerRoutes();
  
  // Update package.json
  updatePackageJson();
  
  // Create Next.js config
  createNextConfig();
  
  // Delete Vite-specific files
  deleteViteFiles();
  
  // Create .env.local file
  createEnvFile();
  
  console.log('\nMigration to Next.js completed successfully! 🎉');
  console.log('\nNext steps:');
  console.log('1. Update your environment variables in .env.local');
  console.log('2. Run npm install to ensure Next.js dependencies are installed');
  console.log('3. Run npm run dev to start the Next.js development server');
  console.log('4. Verify that everything works as expected');
}

// Run the migration
runMigration();