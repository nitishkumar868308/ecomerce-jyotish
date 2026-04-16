/** @type {import('next').NextConfig} */
const nextConfig = {
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
  },
};

export default nextConfig;
