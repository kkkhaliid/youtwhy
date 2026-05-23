import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/music/:path*',
        destination: `${backendUrl}/api/music/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${backendUrl}/api/auth/:path*`,
      },
      {
        source: '/stream/:path*',
        destination: `${backendUrl}/api/stream/:path*`,
      },
    ];
  },
};

export default nextConfig;
