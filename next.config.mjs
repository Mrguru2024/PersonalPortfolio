/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ["pg"],
    esmExternals: "loose",
  },
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