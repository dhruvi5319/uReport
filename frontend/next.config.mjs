/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do NOT add X-Frame-Options: DENY — iframe preview must work
  // Security headers that are safe to set:
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Deliberately omitting X-Frame-Options to allow iframe preview
        ],
      },
    ];
  },

  // In development, proxy PHP API calls to the PHP container
  async rewrites() {
    const phpApiBase = process.env.PHP_API_BASE_URL ?? 'http://localhost:8080';
    return [
      {
        source: '/api/:path*',
        destination: `${phpApiBase}/api/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${phpApiBase}/auth/:path*`,
      },
      {
        source: '/open311/:path*',
        destination: `${phpApiBase}/open311/:path*`,
      },
    ];
  },

  // TypeScript strict is configured in tsconfig.json, not here
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
