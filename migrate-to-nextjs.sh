#!/bin/bash

echo "🔄 Starting migration to Next.js..."
echo "⚠️ This will stop the current Express+Vite server and start Next.js instead"
echo "⚠️ If anything goes wrong, you can restore from the backup in the 'backups' folder"
echo ""
echo "Stopping current Express server..."

# Find and kill the Express server process
SERVER_PID=$(ps aux | grep "tsx server/index.ts" | grep -v grep | awk '{print $2}')

if [ -n "$SERVER_PID" ]; then
  echo "📥 Stopping Express server (PID: $SERVER_PID)..."
  kill -9 $SERVER_PID
  echo "✅ Express server stopped"
else
  echo "⚠️ No Express server process found to stop"
fi

# Start the Next.js server
echo "📤 Starting Next.js server..."
./start-nextjs.sh