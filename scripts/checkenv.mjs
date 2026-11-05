// Runs before the build: stops it (so the live site stays as it is) if a setting is missing or a connection fails.
import pg from 'pg'
const need = ['PAYLOAD_SECRET', 'DATABASE_URI', 'DATABASE_URI_MIGRATE']
const missing = need.filter((k) => !process.env[k])
if (missing.length) { console.error('Missing environment variables:', missing.join(', ')); process.exit(1) }
for (const k of ['DATABASE_URI', 'DATABASE_URI_MIGRATE']) {
  const c = new pg.Client({ connectionString: process.env[k], connectionTimeoutMillis: 15000 })
  try { await c.connect(); await c.query('select 1'); console.log(`${k}: connected`) }
  catch (e) { console.error(`${k}: cannot connect (${e.code || e.message}). Check the connection string and password.`); process.exit(1) }
  finally { await c.end().catch(() => {}) }
}
if (process.env.S3_BUCKET) {
  const s3need = ['S3_ENDPOINT', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'].filter((k) => !process.env[k])
  if (s3need.length) { console.error('Missing storage settings:', s3need.join(', ')); process.exit(1) }
  const { S3Client, HeadBucketCommand } = await import('@aws-sdk/client-s3')
  const s3 = new S3Client({ endpoint: process.env.S3_ENDPOINT, region: process.env.S3_REGION, forcePathStyle: true, credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } })
  try { await s3.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET })); console.log('Storage: bucket reachable') }
  catch (e) { console.error(`Storage: cannot reach bucket "${process.env.S3_BUCKET}" (${e.name}). Check the keys, endpoint and bucket name.`); process.exit(1) }
} else console.warn('S3_BUCKET not set: uploads will be stored on the server disk, which Vercel does not keep.')
