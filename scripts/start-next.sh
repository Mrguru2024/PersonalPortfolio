#!/bin/bash

echo "🔄 Shutting down any running Express+Vite processes..."
pkill -f "tsx server/index.ts" || true

echo "🧹 Cleaning up environment..."
rm -rf .next || true
rm -rf node_modules/.cache || true

echo "🚀 Starting Next.js application on port 3000..."
export NODE_OPTIONS="--experimental-json-modules"
export NEXTJS_CONFIG_PATH="next.config.mjs"
exec npx next dev -p 3000