/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove or comment out 'output: 'export'' for SSR/API support
  // output: 'export', // Comment this out
  trailingSlash: true, // Keeps URLs clean
  images: {
    unoptimized: true, // For static images if needed
  },
};

module.exports = nextConfig;