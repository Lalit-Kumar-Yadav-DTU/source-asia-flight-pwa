import withPWA from 'next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Disable in dev mode to keep hot-reloading fast
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest\.json$/],
})(nextConfig)