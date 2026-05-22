// Quick schema verification script
// Run: node db/verify-schema.mjs
import postgres from 'postgres'

const DB_URL = 'postgresql://postgres:BkOvFERsFRjjYFfEcCBnxzlzikQWjlpv@postgres.railway.internal:41696/railway'

const EXPECTED_TABLES = [
  'languages', 'fantasy_categories', 'fantasy_tags', 'vibe_tags',
  'mood_tags', 'orientation_tags', 'story_categories',
  'users', 'user_accounts', 'user_profiles', 'user_fantasy_tags',
  'companions', 'companion_accounts', 'companion_profiles',
  'companion_photos', 'companion_videos', 'companion_languages',
  'companion_vibe_tags', 'companion_fantasy_tags', 'session_cards',
  'companion_onboarding_progress', 'companion_verifications',
  'companion_legal_docs', 'companion_payment_setup', 'didit_extracted_data',
  'stories', 'story_mood_tags', 'story_orientation_tags',
  'story_fantasy_tags', 'story_story_categories', 'audio_recordings',
  'companion_story_bridges', 'likes', 'saves', 'comments',
  'notifications', 'push_subscriptions', 'booking_requests',
  'fantasy_tag_overlap_scores', 'analytics_events',
]

const sql = postgres(DB_URL, { connect_timeout: 10 })

async function verify() {
  console.log('\n=== BlushBite Schema Verification ===\n')

  // 1. Check all tables exist
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `
  const found = tables.map(r => r.table_name)

  console.log(`Found ${found.length} tables in DB:\n`)
  const missing = []
  const extra = []

  for (const t of EXPECTED_TABLES) {
    const ok = found.includes(t)
    console.log(`  ${ok ? '✓' : '✗'} ${t}`)
    if (!ok) missing.push(t)
  }
  for (const t of found) {
    if (!EXPECTED_TABLES.includes(t)) extra.push(t)
  }

  // 2. Check foreign keys
  const fks = await sql`
    SELECT COUNT(*) AS count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
  `
  console.log(`\nForeign keys: ${fks[0].count} (expected ~52)`)

  // 3. Check check constraints
  const checks = await sql`
    SELECT COUNT(*) AS count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'CHECK' AND table_schema = 'public'
  `
  console.log(`Check constraints: ${checks[0].count} (expected ~22)`)

  // 4. Check indexes
  const indexes = await sql`
    SELECT COUNT(*) AS count
    FROM pg_indexes
    WHERE schemaname = 'public'
  `
  console.log(`Indexes: ${indexes[0].count}`)

  // 5. Row counts for lookup tables (should be 0 on fresh DB)
  const lookups = ['languages', 'fantasy_categories', 'vibe_tags', 'mood_tags', 'orientation_tags']
  console.log('\nLookup table row counts (0 = empty, needs seeding):')
  for (const t of lookups) {
    const r = await sql`SELECT COUNT(*) AS c FROM ${sql(t)}`
    console.log(`  ${t}: ${r[0].c} rows`)
  }

  // 6. Summary
  console.log('\n=== RESULT ===')
  if (missing.length === 0) {
    console.log('✓ All expected tables present')
  } else {
    console.log(`✗ MISSING tables: ${missing.join(', ')}`)
  }
  if (extra.length > 0) {
    console.log(`  Extra tables (not in schema): ${extra.join(', ')}`)
  }

  await sql.end()
}

verify().catch(e => {
  console.error('Connection failed:', e.message)
  process.exit(1)
})
