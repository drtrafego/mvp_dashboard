import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://clientes.casaldotrafego.com",
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://clientes.casaldotrafego.com',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

