/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Configure image domains that are allowed for optimization 
  images: {
    domains: [
      'localhost',
      'mrguru.dev',
      'images.unsplash.com',
      'source.unsplash.com',
      'via.placeholder.com',
    ],
  },
  
  // Disable Next.js server-side build-time linting
  // (we'll use our own lint process)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configure custom output directory for build files
  distDir: '.next',
  
  // Configure redirects if needed
  async redirects() {
    return [
      // Example redirect for legacy URLs
      // {
      //   source: '/old-blog/:slug',
      //   destination: '/blog/:slug',
      //   permanent: true,
      // },
    ];
  },
  
  // Configure headers
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Configure webpack if needed
  webpack: (config, { isServer }) => {
    // Add custom webpack configuration if needed
    return config;
  },
  
  // The App Router is now the default in Next.js 14+
  // No experimental config needed
};

module.exports = nextConfig;