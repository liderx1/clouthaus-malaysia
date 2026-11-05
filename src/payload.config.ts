import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { en } from '@payloadcms/translations/languages/en'
import { zh } from '@payloadcms/translations/languages/zh'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Reports } from './collections/Reports'
import { Media } from './collections/Media'
import { Stores } from './collections/Stores'
import { Events, Highlights, Notices, Facilities, Facts, Entrances, Exits, Routes } from './collections/Content'
import { Site, Seo } from './globals'
import { LOCALES, SITE_CONFIG, localeName } from './lib/site'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const s3 = !!process.env.S3_BUCKET

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ` · ${SITE_CONFIG.name} CMS`, icons: [{ url: '/images/favicon.svg' }] },
    components: { graphics: { Logo: '@/components/Brand#Logo', Icon: '@/components/Brand#Icon' }, beforeDashboard: ['@/components/Welcome#Welcome'] },
    livePreview: { breakpoints: [{ label: 'Phone', name: 'phone', width: 390, height: 844 }, { label: 'Tablet', name: 'tablet', width: 820, height: 1180 }, { label: 'Desktop', name: 'desktop', width: 1440, height: 900 }] },
    importMap: { baseDir: path.resolve(dirname) },
  },
  i18n: { supportedLanguages: { en, zh }, fallbackLanguage: 'en' },
  localization: {
    // languages from site.config.json; kept in the order the database was first created in (en, ms, zh for EkoCheras)
    locales: [...LOCALES].sort((a, b) => (a === 'en' ? -1 : b === 'en' ? 1 : a.localeCompare(b))).map((code) => ({ label: localeName(code), code })),
    defaultLocale: 'en',
    fallback: true,
  },
  collections: [Stores, Events, Highlights, Notices, Facilities, Facts, Entrances, Exits, Routes, Media, Users, Reports],
  globals: [Site, Seo],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  // Supabase Postgres. Tables live in their own "payload" schema, never in "public" (which Supabase exposes through its API).
  db: postgresAdapter({
    schemaName: 'payload',
    pool: { connectionString: (process.env.PAYLOAD_MIGRATING && process.env.DATABASE_URI_MIGRATE) || process.env.DATABASE_URI || '' },
    migrationDir: path.resolve(dirname, 'migrations'),
    push: false,
  }),
  sharp,
  plugins: [
    s3Storage({
      enabled: s3,
      collections: { media: true },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION,
        forcePathStyle: true,
        credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID || '', secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '' },
      },
    }),
  ],
})
