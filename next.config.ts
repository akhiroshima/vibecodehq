import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co", pathname: "/**" },
    ],
  },
  experimental: {
    serverActions: {
      // Admin AI draft assistant accepts PDFs, DOCX, ZIPs, etc.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
