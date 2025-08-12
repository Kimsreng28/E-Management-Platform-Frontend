import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  i18n: {
    locales: ["en", "kh"],
    defaultLocale: "en",
  },
  reactStrictMode: true,
  images: {
    domains: ["localhost", "127.0.0.1"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/customer",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
