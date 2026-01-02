import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy API requests to backend services during development
  async rewrites() {
    // Only apply rewrites in development (when running locally without Nginx)
    if (process.env.NODE_ENV === 'development' || process.env.ENABLE_API_PROXY === 'true') {
      return [
        // Auth service (port 3002)
        {
          source: '/api/v1/auth/:path*',
          destination: 'http://localhost:3002/api/v1/auth/:path*',
        },
        // Business service (port 3003)
        {
          source: '/api/v1/businesses/:path*',
          destination: 'http://localhost:3003/api/v1/businesses/:path*',
        },
        {
          source: '/api/v1/users/:path*',
          destination: 'http://localhost:3002/api/v1/users/:path*', // User endpoints are in auth service
        },
        // Party service (port 3004)
        {
          source: '/api/v1/parties/:path*',
          destination: 'http://localhost:3004/api/v1/parties/:path*',
        },
        // Inventory service (port 3005)
        {
          source: '/api/v1/items/:path*',
          destination: 'http://localhost:3005/api/v1/items/:path*',
        },
        {
          source: '/api/v1/stock/:path*',
          destination: 'http://localhost:3005/api/v1/stock/:path*',
        },
        {
          source: '/api/v1/categories/:path*',
          destination: 'http://localhost:3005/api/v1/categories/:path*',
        },
        // Invoice service (port 3006)
        {
          source: '/api/v1/invoices/:path*',
          destination: 'http://localhost:3006/api/v1/invoices/:path*',
        },
        // Payment service (port 3007)
        {
          source: '/api/v1/payments/:path*',
          destination: 'http://localhost:3007/api/v1/payments/:path*',
        },
        // Health checks
        {
          source: '/health',
          destination: 'http://localhost:3000/health',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
