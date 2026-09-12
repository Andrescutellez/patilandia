import type { NextConfig } from "next";

// Vendure serves product/collection images from its own asset server as absolute URLs (unlike
// the mock/Medusa data, which used relative paths already inside public/), on the same origin as
// the Shop API. Deriving the allowed remote pattern from NEXT_PUBLIC_VENDURE_SHOP_API_URL instead
// of hardcoding host/port means this doesn't need a code change every time Vendure runs on a
// different port or domain (local dev, staging, production) — only the env var does.
const shopApiUrl = new URL(process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL ?? "http://localhost:3000/shop-api");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: shopApiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: shopApiUrl.hostname,
        port: shopApiUrl.port,
        pathname: "/assets/**"
      }
    ]
  }
};

export default nextConfig;
