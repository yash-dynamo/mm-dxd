import type { NextConfig } from "next";

const DXD_API_URL = process.env.NEXT_PUBLIC_DXD_API_URL ?? "http://localhost:8199/v1";
// Strip the /v1 suffix for the rewrite destination — we include it in the source pattern
const DXD_UPSTREAM = DXD_API_URL.replace(/\/v1\/?$/, "");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.coingecko.com",
        pathname: "/coins/images/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/dxd/:path*",
        destination: `${DXD_UPSTREAM}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
