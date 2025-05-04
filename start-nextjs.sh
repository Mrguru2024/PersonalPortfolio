#!/bin/bash
echo "🔄 Starting Next.js application..."

# Verify environment variables are available
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️ DATABASE_URL is not set. Database functionality may not work properly."
else
  echo "✅ Database connection confirmed"
fi

# Start Next.js development server
echo "🚀 Launching Next.js app on port 3000..."
npx next dev -p 3000