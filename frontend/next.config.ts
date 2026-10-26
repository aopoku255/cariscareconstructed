import type { NextConfig } from 'next';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';
const isProd = process.env.NODE_ENV === 'production';

/**
 * Optional same-origin API proxy. When the website and API are on hosts browsers treat as
 * different sites (e.g. two *.onrender.com services), the SameSite admin cookie would not be sent.
 * Setting API_PROXY_TARGET (at build time) proxies /api/v1/* through this site, so the browser
 * only ever talks to one origin. Point NEXT_PUBLIC_API_BASE_URL at this site's /api/v1.
 */
const proxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, '');
/**
 * Hosts that serve uploaded images: the API itself (local-storage driver), the API behind the
 * proxy, and/or the public media bucket (Cloudflare R2). All drivers store objects under an
 * `uploads/` prefix, so a single pathname pattern covers every origin.
 */
const imageOrigins = [apiBase, proxyTarget, process.env.MEDIA_PUBLIC_URL].filter(Boolean).map((url) => new URL(url!));

const nextConfig: NextConfig = {
  // Self-contained server bundle for cPanel's Node.js application manager.
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // Every storage driver (local disk, R2, Worker) puts files under /uploads/.
    remotePatterns: imageOrigins.map((origin) => ({
      protocol: origin.protocol.replace(':', '') as 'http' | 'https',
      hostname: origin.hostname,
      port: origin.port,
      pathname: '/uploads/**',
    })),
    // Local development serves the API from localhost; never enabled in production builds.
    dangerouslyAllowLocalIP: !isProd,
    // Optimisation needs the `sharp` binary on the server. Set NEXT_IMAGE_UNOPTIMIZED=true if the host cannot run it.
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === 'true',
    formats: ['image/avif', 'image/webp'],
    qualities: [70, 80],
  },
  async rewrites() {
    return proxyTarget ? [{ source: '/api/v1/:path*', destination: `${proxyTarget}/api/v1/:path*` }] : [];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : []),
        ],
      },
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
};

export default nextConfig;
