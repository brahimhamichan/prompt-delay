import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.tail36228.ts.net"],
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
