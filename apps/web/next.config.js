/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false,
  },
  serverExternalPackages: ['postgres', 'pg', 'drizzle-orm'],
}

module.exports = nextConfig
