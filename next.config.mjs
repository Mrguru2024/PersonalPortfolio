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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/github',
        destination: 'https://github.com/Mrguru2024',
        permanent: false,
      },
      {
        source: '/twitter',
        destination: 'https://twitter.com/MrGuru2024',
        permanent: false,
      },
      {
        source: '/linkedin',
        destination: 'https://linkedin.com/in/anthony-feaster',
        permanent: false,
      }
    ];
  },
};

export default nextConfig;