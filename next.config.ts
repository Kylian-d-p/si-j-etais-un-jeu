import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "100.115.53.23",
      },
      {
        protocol: "https",
        hostname: "100.115.53.23",
      },
    ],
    dangerouslyAllowSVG: true,
    unoptimized: false,
  },
  experimental: {
    allowMiddlewareResponseBody: true,
  },
};

export default nextConfig;
