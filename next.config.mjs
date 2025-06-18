/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add any specific Next.js configurations here if needed
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
