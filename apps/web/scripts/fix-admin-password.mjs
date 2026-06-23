import { createPool } from '@vercel/postgres'
import pkg from 'bcryptjs'
const { hash, compare } = pkg
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const pool = createPool({ connectionString: process.env.DATABASE_URL })

const PASSWORD = 'Admin@BlushBite2024!'
const EMAIL = 'admin@blushbite.co'

async function run() {
  const newHash = await hash(PASSWORD, 12)
  const verifyOk = await compare(PASSWORD, newHash)
  console.log('[1] New hash generated, self-verify:', verifyOk)

  const { rows } = await pool.sql`
    UPDATE users
    SET hashed_password = ${newHash}, onboarding_complete = true
    WHERE email = ${EMAIL}
    RETURNING email, onboarding_complete, hashed_password IS NOT NULL AS has_pw
  `
  console.log('[2] DB updated:', JSON.stringify(rows[0]))

  const { rows: check } = await pool.sql`SELECT hashed_password FROM users WHERE email = ${EMAIL}`
  const dbHash = check[0].hashed_password
  const dbOk = await compare(PASSWORD, dbHash)
  console.log('[3] DB hash vs password verify:', dbOk)

  if (!dbOk) {
    console.error('ERROR: DB hash does not match password! Something went wrong.')
    process.exit(1)
  }

  console.log('\n✅ Admin password correctly set.')
  console.log('   Email:', EMAIL)
  console.log('   Password:', PASSWORD)
  process.exit(0)
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
