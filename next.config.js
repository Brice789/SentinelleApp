/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3010/api/:path*'
      },
      {
        source: '/events',
        destination: 'http://localhost:3010/events'
      }
    ]
  }
}

module.exports = nextConfig