/**
 * Add performance indexes missing from schema.
 * Run: npx tsx --env-file .env.local scripts/add-perf-indexes.ts
 */
import postgres from 'postgres'

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })

  console.log('Creating performance indexes...\n')

  await sql`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cp_visible_completeness
      ON companion_profiles(profile_completeness DESC)
      WHERE is_visible_to_users = true
  `
  console.log('  ✓ idx_cp_visible_completeness (feed WHERE + ORDER BY)')

  await sql`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cphotos_profile_id
      ON companion_photos(companion_profile_id)
      WHERE deleted_at IS NULL
  `
  console.log('  ✓ idx_cphotos_profile_id (photo batch-load)')

  await sql`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scards_profile_id
      ON session_cards(companion_profile_id)
      WHERE deleted_at IS NULL
  `
  console.log('  ✓ idx_scards_profile_id (session card batch-load)')

  await sql`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cvibe_profile_id
      ON companion_vibe_tags(companion_profile_id)
  `
  console.log('  ✓ idx_cvibe_profile_id (vibe tag batch-load)')

  const indexes = await sql`
    SELECT indexname FROM pg_indexes
    WHERE tablename IN ('companion_profiles','companion_photos','session_cards','companion_vibe_tags')
      AND indexname LIKE 'idx_%'
    ORDER BY indexname
  `
  console.log('\nActive perf indexes:', indexes.map(r => r.indexname))

  await sql.end()
}

main().catch(e => { console.error(e); process.exit(1) })
