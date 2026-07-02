import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      new URL("https://images.unsplash.com/**"),
      new URL("https://i.ytimg.com/**"),
    ],
  },
};

export default nextConfig;
