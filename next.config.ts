import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  env: {
    NEXT_PUBLIC_STACK_PROJECT_ID: "a40fb3c8-efc6-413b-b108-6f4918b528f3",
    NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: "pck_v491sr955v9vwtmc8kt7s4n4jrcsrwt896ms06b5ww4zr",
    STACK_SECRET_SERVER_KEY: "ssk_k9rt8cpwtt657txg791janyss58bmtqdr5n8903tpw8d8",
  },
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

