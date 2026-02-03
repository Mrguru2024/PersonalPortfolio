import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Avoid favicon.ico 404: redirect to SVG icon
  async redirects() {
    return [
      { source: '/favicon.ico', destination: '/favicon.svg', permanent: true },
    ];
  },
  
  // Mark server-side packages that use AMD modules as external
  // This prevents bundlers from trying to bundle them (Turbopack doesn't support AMD)
  serverExternalPackages: ['@getbrevo/brevo'],
  
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  
  // Enable experimental features if needed
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'framer-motion'],
  },
  
  // Turbopack configuration (for dev mode with --turbo flag)
  // Note: Builds use Webpack (--webpack flag) because Turbopack doesn't support AMD modules
  turbopack: {
    resolveAlias: {
      '@': path.resolve(process.cwd(), 'app'),
      '@shared': path.resolve(process.cwd(), 'shared'),
      '@server': path.resolve(process.cwd(), 'server'),
    },
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Webpack config to handle shared schema and server imports
  webpack: (config, { isServer }) => {
    // Add aliases to match tsconfig.json paths
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd(), 'app'),
      '@shared': path.resolve(process.cwd(), 'shared'),
      '@server': path.resolve(process.cwd(), 'server'),
    };
    
    // Fix for Brevo package module resolution issue
    // The package uses AMD-style imports without relative paths
    if (isServer) {
      const brevoSrcPath = path.resolve(process.cwd(), 'node_modules/@getbrevo/brevo/src');
      
      // Enable preferRelative to resolve module requests as relative when possible
      config.resolve.preferRelative = true;
      
      // Add module resolution for Brevo package context
      config.resolve.modules = [
        ...(config.resolve.modules || ['node_modules']),
        brevoSrcPath, // Add Brevo src directory to module resolution
      ];
      
      // Add aliases for common Brevo imports
      config.resolve.alias = {
        ...config.resolve.alias,
        // Resolve common Brevo module names to their actual files
        'ApiClient': path.resolve(brevoSrcPath, 'ApiClient.js'),
        'api/AccountApi': path.resolve(brevoSrcPath, 'api/AccountApi.js'),
        'api/TransactionalEmailsApi': path.resolve(brevoSrcPath, 'api/TransactionalEmailsApi.js'),
      };
      
      // Use NormalModuleReplacementPlugin to fix AMD-style imports
      // The Brevo package uses AMD define() which expects module names without './'
      // Access webpack from Next.js's bundled version
      const webpack = require('next/dist/compiled/webpack/webpack-lib');
      config.plugins = config.plugins || [];
      
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^[^./]/,
          (resource) => {
            // Only process if resolving from Brevo package
            if (resource.context && resource.context.includes('@getbrevo/brevo/src')) {
              const moduleName = resource.request;
              
              // Skip relative/absolute paths
              if (moduleName.startsWith('./') || moduleName.startsWith('../') || path.isAbsolute(moduleName)) {
                return;
              }
              
              // Try resolving from Brevo src directory
              const possiblePaths = [
                path.resolve(brevoSrcPath, `${moduleName}.js`),
                path.resolve(brevoSrcPath, `${moduleName}/index.js`),
              ];
              
              for (const possiblePath of possiblePaths) {
                try {
                  if (fs.existsSync(possiblePath)) {
                    resource.request = possiblePath;
                    return;
                  }
                } catch (e) {
                  // Continue
                }
              }
            }
          }
        )
      );
    }
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      // Exclude Brevo from client bundle entirely
      config.externals = config.externals || [];
      if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        config.externals = [
          ...(Array.isArray(config.externals) ? config.externals : []),
          ({ request }, callback) => {
            if (request && (request.includes('@getbrevo/brevo') || request === 'ApiClient')) {
              return callback(null, 'commonjs ' + request);
            }
            if (typeof originalExternals === 'function') {
              return originalExternals({ request }, callback);
            }
            callback();
          },
        ];
      } else if (Array.isArray(config.externals)) {
        config.externals.push(({ request }, callback) => {
          if (request && (request.includes('@getbrevo/brevo') || request === 'ApiClient')) {
            return callback(null, 'commonjs ' + request);
          }
          callback();
        });
      }
    }
    return config;
  },
};

export default nextConfig;
