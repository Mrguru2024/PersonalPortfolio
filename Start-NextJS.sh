#!/bin/bash

# This script is a wrapper to start the Next.js version of the MrGuru.dev portfolio
# It will stop any running Express server, fix import paths, and start Next.js

# Display banner
echo "╔════════════════════════════════════════╗"
echo "║  MrGuru.dev Portfolio - Next.js Mode   ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Stop Express server if running
pkill -f "tsx server/index.ts" 2>/dev/null || true
echo "✅ Any running Express servers stopped"

# Fix paths for Next.js compatibility
echo "🔧 Preparing Next.js environment..."

# Fix component imports
find app/components/ui -type f -name "*.tsx" -exec sed -i 's|@/app/lib/utils|@/lib/utils|g' {} \; 2>/dev/null || true
find app/components -type f -name "*.tsx" -exec sed -i 's|from "lucide-react"|from "lucide-react/dist/esm/index"|g' {} \; 2>/dev/null || true

# Create necessary directories
mkdir -p app/lib app/types 2>/dev/null || true

# Verify Next.js config
if [ ! -f "next.config.mjs" ]; then
  echo "❌ next.config.mjs not found. Creating..."
  cat > next.config.mjs << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['github.com', 'avatars.githubusercontent.com', 'images.unsplash.com'],
  },
  // Use server components by default
  compiler: {
    // Enables the styled-components SWC transform
    styledComponents: true,
  },
  webpack(config) {
    // Support for svg imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
EOL
  echo "✅ Created next.config.mjs"
fi

# Set environment variables
export NODE_OPTIONS="--experimental-json-modules"

# Start Next.js
echo "🚀 Starting Next.js server on port 3000..."
echo "Access your site at: https://workspace.mytech7.repl.co/"
echo "--------------------------------------------"

# Run Next.js development server
exec npx next dev -p 3000