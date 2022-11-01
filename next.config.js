/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  images:{
    domains: ['api.thegraph.com','ipfs.network.thegraph.com']
  }
}

module.exports = nextConfig
