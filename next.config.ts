import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/root',
        destination: '/',
        permanent: false,
      },
      {
        source: '/student/login',
        destination: '/login/student',
        permanent: false,
      },
      {
        source: '/admin/login',
        destination: '/login/admin',
        permanent: false,
      },
      {
        source: '/staff/login',
        destination: '/login/staff',
        permanent: false,
      },
      {
        source: '/college/login',
        destination: '/login/college',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
