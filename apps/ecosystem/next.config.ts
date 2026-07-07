import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  eslint: {
    dirs: ["src"]
  }
};

export default nextConfig;
