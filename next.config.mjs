/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // AWS SDK v3 packages should be excluded from browser bundles
  // if they are only used server-side. Add them here if needed.
  // serverOnlyPackages: ['@aws-sdk/client-dynamodb'],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
