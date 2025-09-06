import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("@libsql/client");
    }
    return config;
  },
};

export default nextConfig;
