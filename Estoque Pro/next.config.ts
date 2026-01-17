import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.youtube.com https://www.youtube.com https://*.stackframe.co https://*.stack-auth.com https://*.googletagmanager.com https://*.google-analytics.com https://www.googletagmanager.com https://www.google-analytics.com https://tagmanager.google.com https://www.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://tagmanager.google.com",
      "img-src 'self' data: blob: https: https://*.google-analytics.com https://*.googletagmanager.com https://www.googletagmanager.com https://www.google.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.youtube.com https://www.youtube.com https://*.stackframe.co https://*.stack-auth.com https://api.stack-auth.com https://*.supabase.co https://accounts.google.com https://*.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.google-analytics.com https://www.google.com",
      "frame-src 'self' https://*.youtube.com https://www.youtube.com https://*.stackframe.co https://*.stack-auth.com https://accounts.google.com https://*.googletagmanager.com https://www.googletagmanager.com",
      "frame-ancestors 'none'",
      "form-action 'self' https://*.stack-auth.com https://accounts.google.com",
      "base-uri 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Security headers
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  // Disable X-Powered-By header
  poweredByHeader: false,
};

export default nextConfig;

