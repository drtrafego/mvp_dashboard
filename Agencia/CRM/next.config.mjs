/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! PERIGO: Ignora erros para fazer o build passar de qualquer jeito !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora o "corretor de estilo"
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
