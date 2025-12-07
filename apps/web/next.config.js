const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/demo',
  assetPrefix: '/demo',
  transpilePackages: ['@hamkasb/core', '@hamkasb/ui', '@hamkasb/i18n'],
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = withNextIntl(nextConfig)

