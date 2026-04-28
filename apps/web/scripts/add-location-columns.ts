/**
 * One-off migration: add missing location columns to the `users` table.
 * These columns exist in schema.ts but were never pushed to the live DB,
 * causing the Google OAuth callback to crash with:
 *   PostgresError: column "latitude" does not exist
 *
 * Run once: npx tsx scripts/add-location-columns.ts
 */
import postgres from 'postgres'

const DB_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:IEyufsebjCWfstCHSjJtpvuAXgInSxED@mainline.proxy.rlwy.net:55141/railway'

const sql = postgres(DB_URL)

async function main() {
  console.log('Adding missing location columns to users table...')

  await sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS latitude            NUMERIC(10, 8),
      ADD COLUMN IF NOT EXISTS longitude           NUMERIC(11, 8),
      ADD COLUMN IF NOT EXISTS location_enabled    BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ
  `

  console.log('✅  Done — location columns added (or already existed).')
  await sql.end()
}

main().catch((err) => {
  console.error('❌  Migration failed:', err)
  process.exit(1)
})
