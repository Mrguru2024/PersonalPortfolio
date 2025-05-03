/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  // swcMinify is now enabled by default in Next.js 14+
  // Next.js 15 configuration
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  output: 'standalone',
  poweredByHeader: false,
  images: {
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    // Support importing files from src directory
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './client/src',
      '@shared': './shared',
      '@app': './app',
      '@assets': './public/assets',
    };
    return config;
  },
};

export default nextConfig;