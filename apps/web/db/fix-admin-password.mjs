// Fix admin password so credentials login works
// Run from apps/web: node db/fix-admin-password.mjs
import postgres from 'postgres'
import bcrypt   from 'bcryptjs'
import dotenv   from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local') })

const DB_URL       = process.env.DATABASE_URL
const ADMIN_EMAIL  = 'admin@blushbite.co'
const NEW_PASSWORD = 'Admin@BlushBite2024!'

const sql = postgres(DB_URL, { ssl: 'require', connect_timeout: 10 })

async function run() {
  console.log('\n=== Fix Admin Password ===\n')

  // 1. Generate hash
  const hashed = await bcrypt.hash(NEW_PASSWORD, 12)
  const selfOk = await bcrypt.compare(NEW_PASSWORD, hashed)
  console.log('[1] Hash generated — self-verify:', selfOk)

  // 2. Write to DB
  const rows = await sql`
    UPDATE users
    SET
      hashed_password     = ${hashed},
      onboarding_complete = true
    WHERE email = ${ADMIN_EMAIL}
    RETURNING email, onboarding_complete, hashed_password IS NOT NULL AS has_pw
  `
  console.log('[2] DB row after update:', rows[0])

  // 3. Read back and verify
  const check = await sql`SELECT hashed_password FROM users WHERE email = ${ADMIN_EMAIL} LIMIT 1`
  const dbHash = check[0]?.hashed_password
  if (!dbHash) { console.error('ERROR: no hash in DB after update!'); process.exit(1) }
  const dbOk = await bcrypt.compare(NEW_PASSWORD, dbHash)
  console.log('[3] DB hash verifies against password:', dbOk)

  if (!dbOk) {
    console.error('\nERROR: Hash stored in DB does NOT match the password. Something corrupted it.')
    process.exit(1)
  }

  console.log('\n✅  Admin password is correctly set.')
  console.log('    Email   :', ADMIN_EMAIL)
  console.log('    Password:', NEW_PASSWORD)
  console.log('    Login at: https://blushbite.co/auth/signin\n')

  await sql.end()
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
