/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gzip/brotli compression of page responses at the Next layer — saves
  // meaningful bytes over slower network paths (~25-40% smaller HTML).
  compress: true,

  // Cut the x-powered-by header so scrapers have one less fingerprint.
  poweredByHeader: false,

  // Build-time perf: use the faster experimental bundler behaviour where
  // safe. Webpack persistent cache is on by default.
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "hecatewizardmall.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "72.61.237.76",
        pathname: "/uploads/**",
      },
    ],
    // Restrict device sizes so Next generates fewer variants — smaller
    // .next folder + fewer cold-cache resizes on the server.
    deviceSizes: [360, 640, 750, 828, 1080, 1280, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    // Cache the optimiser output for a week; images rarely change and the
    // backend's resolveAssetUrl already busts on filename change.
    minimumCacheTTL: 60 * 60 * 24 * 7,
    formats: ["image/avif", "image/webp"],
  },

  // Ship fewer polyfills + skip source maps in prod builds — faster cold
  // starts. Source maps are still generated for client error traces if
  // the host wants them via SENTRY_UPLOAD_SOURCEMAPS.
  productionBrowserSourceMaps: false,
};

export default nextConfig;
