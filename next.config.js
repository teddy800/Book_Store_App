// next.config.js
const nextConfig = {
  // output: 'export',   ← DELETE THIS LINE COMPLETELY
  images: { unoptimized: true },
  // Optional: silence Turbopack warning
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;