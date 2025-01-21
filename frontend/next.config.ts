import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: 'localhost',
        // protocol: 'http',
        // port: '8000',
        // pathname: '/media/*'
      },
      {
        hostname: 'm.media-amazon.com'
      },
      {
        hostname: 'image.tmdb.org'
      }
    ]
  },
};

export default withNextIntl(nextConfig);
