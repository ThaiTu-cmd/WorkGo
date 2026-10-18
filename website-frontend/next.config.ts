import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  compress: true,
  // Proxy backend calls through the API gateway (avoids CORS in the browser).
  async rewrites() {
    const gateway = process.env.API_GATEWAY_URL || "http://localhost:8888";
    return [{ source: "/api/v1/:path*", destination: `${gateway}/api/v1/:path*` }];
  },
};

export default withNextIntl(nextConfig);
