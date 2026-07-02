import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { hostname: "images.unsplash.com" },
      { hostname: "i.ytimg.com" },
    ],
  },
};

export default nextConfig;
