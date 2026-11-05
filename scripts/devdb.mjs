// Local development only: a throwaway Postgres in ./.pgdata, so the CMS can run without a Supabase project.
import EmbeddedPostgres from 'embedded-postgres'
const pg = new EmbeddedPostgres({ databaseDir: './.pgdata', user: 'payload', password: 'payload', port: 54329, persistent: true })
import fs from 'node:fs'
if (!fs.existsSync('./.pgdata/PG_VERSION')) await pg.initialise()
await pg.start()
try { await pg.createDatabase('ekocheras') } catch { /* already exists */ }
console.log('Local Postgres ready: postgres://payload:payload@localhost:54329/ekocheras')
process.on('SIGINT', async () => { await pg.stop(); process.exit(0) })
setInterval(() => {}, 1 << 30)
