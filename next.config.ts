import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "10.1.3.161",
  ],
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: [
          "**/node_modules/**",
          "**/.next/**",
          "**/.git/**",
          "**/nul",
        ],
        aggregateTimeout: 1000,
        poll: false,
      };
    }
    return config;
  },
};

export default nextConfig;
