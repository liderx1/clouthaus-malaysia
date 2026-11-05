import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { '/': ['./src/site/index.html'] },
  async redirects() {
    return [
      { source: '/about.html', destination: '/#about', permanent: true },
      { source: '/contact.html', destination: '/#contact', permanent: true },
      { source: '/map', destination: '/', permanent: true },
    ]
  },
  async headers() {
    return [{ source: '/map/tex/:file*', headers: [{ key: 'cache-control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/images/:file*', headers: [{ key: 'cache-control', value: 'public, max-age=86400' }] },
      // uploaded logos and posters: cached by the browser and Vercel's edge, so each is fetched from Supabase once
      { source: '/api/media/file/:file*', headers: [{ key: 'cache-control', value: 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400' }] }]
  },
  webpack: (c) => { c.resolve.extensionAlias = { '.cjs': ['.cts', '.cjs'], '.js': ['.ts', '.tsx', '.js', '.jsx'], '.mjs': ['.mts', '.mjs'] }; return c },
  turbopack: { root: path.resolve(dirname) },
}
export default withPayload(nextConfig, { devBundleServerPackages: false })
