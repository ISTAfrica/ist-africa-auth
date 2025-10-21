import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Next.js resolves the correct workspace root when multiple lockfiles exist
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
