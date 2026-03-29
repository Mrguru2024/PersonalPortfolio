import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

/** Hostnames allowed for Server Actions CSRF origin checks (production hardening). */
function getServerActionAllowedOrigins() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return undefined;
  try {
    const { hostname } = new URL(raw);
    if (!hostname || hostname === "localhost") return undefined;
    return [hostname];
  } catch {
    return undefined;
  }
}

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
      { source: '/insights', destination: '/blog', permanent: true },
      { source: '/insights/:path*', destination: '/blog', permanent: true },
      { source: '/results', destination: '/diagnosis/results', permanent: true },
      { source: '/ecosystem-founders', destination: '/about?founders=1', permanent: true },
    ];
  },

  // Production security headers for the Next.js surface (aligns with server/middleware/vercel-production.ts).
  async headers() {
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Mark server-side packages that use AMD modules as external
  // This prevents bundlers from trying to bundle them (Turbopack doesn't support AMD)
  serverExternalPackages: ['@getbrevo/brevo'],

  /** Recharts + victory-vendor ESM re-exports confuse Webpack’s analyzer; transpiling stabilizes client bundles. */
  transpilePackages: ['recharts'],
  
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year — uploads are immutable; CDN/browser cache longer
    // Tight hosts only (drop http ** + permissive https **). Add hosts when using new remote Image src origins.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      /** GitHub OAuth / profile images (`*.png` on github.com, and avatars CDN). */
      { protocol: 'https', hostname: 'github.com', pathname: '/**' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'mrguru.dev', pathname: '/**' },
      { protocol: 'https', hostname: 'www.ascendra.tech', pathname: '/**' },
      { protocol: 'https', hostname: 'ascendra.tech', pathname: '/**' },
      { protocol: 'https', hostname: '**.vercel.app', pathname: '/**' },
    ],
  },
  
  // Include content/development-updates.md in the serverless bundle for the admin API (Next 16+ top-level)
  outputFileTracingIncludes: {
    '/api/admin/development-updates': ['./content/development-updates.md'],
  },

  // Enable experimental features if needed
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      ...(getServerActionAllowedOrigins()?.length
        ? { allowedOrigins: getServerActionAllowedOrigins() }
        : {}),
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
      // Recharts → victory-vendor/d3-* re-exports break Webpack named-import analysis; point at d3 packages directly.
      'victory-vendor/d3-shape': path.resolve(process.cwd(), 'node_modules/d3-shape/src/index.js'),
      'victory-vendor/d3-scale': path.resolve(process.cwd(), 'node_modules/d3-scale/src/index.js'),
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
