import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker
  output: 'standalone',
  
  // Remove X-Powered-By header
  poweredByHeader: false,
};

export default nextConfig;
