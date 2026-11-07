import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // The development badge overlays the mobile Dashboard navigation target.
  devIndicators: false,
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
