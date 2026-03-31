/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.basemaps.cartocdn.com" },
      { protocol: "https", hostname: "tilecache.rainviewer.com" },
    ],
  },
};

export default nextConfig;
