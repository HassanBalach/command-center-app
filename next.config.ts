import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Lets your phone (same Wi-Fi) load the dev server for the Android app.
  allowedDevOrigins: ["192.168.1.13"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
