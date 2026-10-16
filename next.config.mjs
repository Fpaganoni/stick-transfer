import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * next/image acts as an image proxy for every host listed here, so keep this to
 * hosts the app really renders (a wildcard would let anyone fetch arbitrary URLs
 * through the server). User uploads live on Cloudinary.
 */
const IMAGE_HOSTS = [
  { hostname: "res.cloudinary.com", pathname: "/**" },
  { hostname: "ik.imagekit.io", pathname: "/**" },
  { hostname: "img.youtube.com", pathname: "/vi/**" },
  // Seed / demo data
  { hostname: "images.unsplash.com", pathname: "/**" },
  { hostname: "randomuser.me", pathname: "/api/portraits/**" },
  { hostname: "upload.wikimedia.org", pathname: "/**" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Root layout has no <html>/<body> (they live in app/[locale]/layout.tsx),
  // so unmatched URLs need app/global-not-found.tsx.
  experimental: {
    globalNotFound: true,
  },
  images: {
    remotePatterns: IMAGE_HOSTS.map((host) => ({ protocol: "https", ...host })),
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default withNextIntl(nextConfig);
