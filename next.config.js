// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // REMOVE THIS LINE COMPLETELY – THIS IS THE KILLER
  // output: 'export',

  images: {
    unoptimized: true, // only needed if you use <Image> with static export (you don't anymore)
  },

  // Optional: silence Turbopack warning
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;