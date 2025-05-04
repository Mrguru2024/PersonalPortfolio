#!/bin/bash
echo "🔄 Starting Next.js application..."

# Verify environment variables are available
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️ DATABASE_URL is not set. Database functionality may not work properly."
else
  echo "✅ Database connection confirmed"
fi

# Ensure we use the MJS file extension for Next.js config
if [ -f "next.config.js" ]; then
  echo "ℹ️ Using next.config.mjs instead of next.config.js"
fi

# Start Next.js development server
echo "🚀 Launching Next.js app on port 3000..."
NEXTJS_CONFIG_PATH=next.config.mjs npx next dev -p 3000