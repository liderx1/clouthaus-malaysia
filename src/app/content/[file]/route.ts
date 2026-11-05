import { headers } from 'next/headers'
import { build, payload } from '@/lib/content'

export const dynamic = 'force-dynamic'

// /content/stores.json etc. Editors previewing drafts (logged in, ?draft=1) see unpublished changes.
export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const name = (await params).file.replace(/\.json$/, '')
  let draft = false
  if (new URL(req.url).searchParams.get('draft') === '1') {
    const { user } = await (await payload()).auth({ headers: await headers() })
    draft = !!user
  }
  const data = await build(name, draft)
  if (!data) return new Response('Not found', { status: 404 })
  return Response.json(data, { headers: { 'cache-control': draft ? 'no-store' : 'public, s-maxage=5, stale-while-revalidate=20' } })
}
