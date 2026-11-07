import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["*.kirk.replit.dev"],
  outputFileTracingIncludes: { "/*": ["./certs/supabase-root-2021.crt"] },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
