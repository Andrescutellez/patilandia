import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Vendure serves product/collection images from its own asset server as absolute URLs
    // (unlike the mock/Medusa data, which used relative paths already inside public/).
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/assets/**"
      }
    ]
  }
};

export default nextConfig;
