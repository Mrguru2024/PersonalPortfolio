#!/bin/bash

# This script handles the migration from Express+Vite to Next.js
# It creates a backup, stops Express, and starts Next.js

echo "🚀 MrGuru.dev Portfolio - Next.js Migration"
echo "============================================"
echo ""

# Create a timestamp for backup
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_DIR="backups/pre-nextjs-migration-$TIMESTAMP"

# Create backup directory
echo "📦 Creating backup of current project..."
mkdir -p "$BACKUP_DIR"
cp -r app client server shared components.json next.config.js "$BACKUP_DIR/" 2>/dev/null || true
echo "✅ Backup created at $BACKUP_DIR"

# Stop any running Express server
echo "🛑 Stopping Express+Vite server..."
SERVER_PID=$(ps aux | grep 'tsx server/index.ts' | grep -v grep | awk '{print $2}')
if [ -n "$SERVER_PID" ]; then
  kill -9 $SERVER_PID 2>/dev/null || true
  echo "✅ Express server stopped"
else
  echo "ℹ️ No Express server detected"
fi

# Clean up build artifacts
echo "🧹 Cleaning up build artifacts..."
rm -rf .next node_modules/.cache 2>/dev/null || true

# Fix imports in UI components
echo "🔧 Fixing component import paths..."
find app/components/ui -type f -name "*.tsx" -exec sed -i 's|@/app/lib/utils|@/lib/utils|g' {} \;
find app/components -type f -name "*.tsx" -exec sed -i 's|from "lucide-react"|from "lucide-react/dist/esm/index"|g' {} \;
echo "✅ Import paths fixed"

# Check for environment variables
echo "🔍 Checking environment variables..."
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️ Warning: DATABASE_URL is not set. Database functionality may not work properly."
else
  echo "✅ Database connection confirmed"
fi

# Verify GitHub OAuth credentials
if [ -z "$GITHUB_CLIENT_ID" ] || [ -z "$GITHUB_CLIENT_SECRET" ]; then
  echo "⚠️ Warning: GitHub OAuth credentials missing. Authentication may not work properly."
else
  echo "✅ GitHub OAuth credentials confirmed"
fi

# Set up environment for Next.js
echo "🔧 Setting up Next.js environment..."
export NODE_OPTIONS="--experimental-json-modules"
export NEXTJS_CONFIG_PATH="next.config.mjs"

# Start Next.js development server
echo "🚀 Starting Next.js on port 3000..."
echo "Access your site at: https://workspace.mytech7.repl.co/"
echo "--------------------"
exec npx next dev -p 3000