import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { createSecurityHeaders } from "./src/config/security-headers";

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: "./messages/en.json",
  },
});

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: createSecurityHeaders({
          apiUrl: process.env.NEXT_PUBLIC_API_URL,
          isDevelopment: process.env.NODE_ENV === "development",
        }),
      },
    ];
  },
};

export default withNextIntl(nextConfig);
