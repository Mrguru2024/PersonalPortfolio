#!/bin/bash

echo "🔄 Starting migration to Next.js..."
echo "⚠️  This will stop the current Express+Vite server and start Next.js"
echo ""

# Create a backup of the current project
timestamp=$(date +"%Y%m%d-%H%M%S")
backup_dir="backups/pre-nextjs-migration-$timestamp"
mkdir -p "$backup_dir"

echo "📦 Creating backup of current project..."
cp -r app client server shared components.json next.config.js "$backup_dir/" 2>/dev/null || true
echo "✅ Backup created at $backup_dir"

# Stop the Express+Vite server if it's running
pids=$(ps aux | grep 'tsx server/index.ts' | grep -v grep | awk '{print $2}')
if [ -n "$pids" ]; then
  echo "🛑 Stopping Express+Vite server..."
  for pid in $pids; do
    kill -9 "$pid" 2>/dev/null || true
  done
  echo "✅ Server stopped"
else
  echo "ℹ️  No Express+Vite server detected"
fi

# Clean up build artifacts
echo "🧹 Cleaning up build artifacts..."
rm -rf .next node_modules/.cache 2>/dev/null || true

# Execute Next.js
echo "🚀 Starting Next.js server..."
export NODE_OPTIONS="--experimental-json-modules"
export NEXTJS_CONFIG_PATH="next.config.mjs"
npx next dev -p 3000