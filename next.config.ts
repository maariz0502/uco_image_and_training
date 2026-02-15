import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
      serverActions: {
        bodySizeLimit: '5mb',
      },
    },
    images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos', // Replace with your image domain
        port: '',
        pathname: '/seed/**', 
      },
      {
        protocol: 'https',
        hostname: 'd34sqaou2sl9zh.cloudfront.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
