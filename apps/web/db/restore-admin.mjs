// Restore admin account
// Run from apps/web: node db/restore-admin.mjs
import postgres from 'postgres'

const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:BkOvFERsFRjjYFfEcCBnxzlzikQWjlpv@shortline.proxy.rlwy.net:41696/railway'

const ADMIN_EMAIL = 'admin@blushbite.co'
const ADMIN_ID    = 'd5fea735-fedd-426e-a151-dcc72290ec9b'

const sql = postgres(DB_URL, { connect_timeout: 10 })

async function restore() {
  console.log('\n=== BlushBite Admin Restore ===\n')

  // Check if the user row already exists (e.g. partial delete)
  const existing = await sql`
    SELECT id FROM users WHERE email = ${ADMIN_EMAIL} LIMIT 1
  `

  let adminId = ADMIN_ID

  if (existing.length > 0) {
    adminId = existing[0].id
    console.log(`User row already exists (id: ${adminId}) — skipping insert.`)
  } else {
    await sql`
      INSERT INTO users (id, email, email_verified, onboarding_complete, created_at, updated_at)
      VALUES (
        ${ADMIN_ID},
        ${ADMIN_EMAIL},
        NOW(),
        TRUE,
        NOW(),
        NOW()
      )
    `
    console.log(`Created user row  id: ${ADMIN_ID}`)
  }

  // Upsert the user_profile with platform_role = 'admin'
  await sql`
    INSERT INTO user_profiles (id, user_id, platform_role, mood_intensity, created_at, updated_at)
    VALUES (gen_random_uuid(), ${adminId}, 'admin', 50, NOW(), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET platform_role = 'admin', updated_at = NOW()
  `
  console.log(`Set platform_role = admin`)

  console.log('\n=== Done ===')
  console.log(`Email : ${ADMIN_EMAIL}`)
  console.log(`ID    : ${adminId}`)
  console.log('\nSign in via Google OAuth using admin@blushbite.co')
  console.log('Sign out first if you have any existing session, then sign in with Google.\n')

  await sql.end()
}

restore().catch(e => {
  console.error('Failed:', e.message)
  process.exit(1)
})
