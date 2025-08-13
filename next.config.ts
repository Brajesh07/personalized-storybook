/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  experimental: {
    serverActions: true,
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    },
    responseLimit: '10mb'
  }
}

module.exports = nextConfig
