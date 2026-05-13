import type { NextConfig } from "next";

const CORS_HEADERS = [
  { key: 'Access-Control-Allow-Origin',  value: '*' },
  { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
  { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: CORS_HEADERS,
      },
    ];
  },
};

export default nextConfig;
