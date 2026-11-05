import type { PayloadRequest } from 'payload'
// Live preview needs an absolute URL on the same origin as the admin
export const abs = (req: PayloadRequest | undefined, path: string) => {
  const h = req?.headers
  const host = h?.get('x-forwarded-host') || h?.get('host')
  const proto = h?.get('x-forwarded-proto') || (host?.startsWith('localhost') ? 'http' : 'https')
  return host ? `${proto}://${host}${path}` : (process.env.NEXT_PUBLIC_SERVER_URL || '') + path
}
