import { db } from './index'
import {
  fantasyCategories,
  fantasyTags,
  moodTags,
  orientationTags,
  storyCategories,
  vibeTags,
} from './schema'
import { sql } from 'drizzle-orm'

async function count(
  table: Parameters<typeof db.select>[0] extends undefined ? never : any
): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(table)
  return row?.n ?? 0
}

async function seed() {
  console.log('🌱  Seeding BlushBite lookup tables…\n')

  // ── 1. fantasy_categories ──────────────────────────────────────────────────
  const fcData = [
    { name: 'Power & Control', slug: 'power-control', sort_order: 1 },
    { name: 'Forbidden', slug: 'forbidden', sort_order: 2 },
    { name: 'Roleplay & Scenarios', slug: 'roleplay-scenarios', sort_order: 3 },
    { name: 'Intimacy & Firsts', slug: 'intimacy-firsts', sort_order: 4 },
    { name: 'Exhibitionism', slug: 'exhibitionism', sort_order: 5 },
    { name: 'Body & Sensation', slug: 'body-sensation', sort_order: 6 },
  ]

  await db.insert(fantasyCategories).values(fcData).onConflictDoNothing()

  // Always SELECT after insert so re-runs get the real IDs
  const fcRows = await db
    .select({ id: fantasyCategories.id, name: fantasyCategories.name })
    .from(fantasyCategories)

  const fcByName = Object.fromEntries(fcRows.map((r) => [r.name, r.id]))

  console.log(`  fantasy_categories : ${fcRows.length} rows`)

  // ── 2. fantasy_tags ────────────────────────────────────────────────────────
  const ftData = [
    // Power & Control
    { name: 'Dominance', slug: 'dominance', category: 'Power & Control' },
    { name: 'Submission', slug: 'submission', category: 'Power & Control' },
    { name: 'Bondage', slug: 'bondage', category: 'Power & Control' },
    { name: 'Discipline & Punishment', slug: 'discipline-punishment', category: 'Power & Control' },
    { name: 'Orgasm Control', slug: 'orgasm-control', category: 'Power & Control' },
    { name: 'Consensual Non-Consent', slug: 'consensual-non-consent', category: 'Power & Control' },
    { name: 'Chastity', slug: 'chastity', category: 'Power & Control' },
    { name: 'Sadism', slug: 'sadism', category: 'Power & Control' },
    { name: 'Masochism', slug: 'masochism', category: 'Power & Control' },
    { name: 'Pet Play', slug: 'pet-play', category: 'Power & Control' },
    // Forbidden
    { name: 'Step-Family', slug: 'step-family', category: 'Forbidden' },
    { name: 'Cheating & Affair', slug: 'cheating-affair', category: 'Forbidden' },
    { name: 'Age Gap', slug: 'age-gap', category: 'Forbidden' },
    { name: 'Boss & Employee', slug: 'boss-employee', category: 'Forbidden' },
    { name: 'Teacher & Student', slug: 'teacher-student', category: 'Forbidden' },
    { name: 'Blackmail', slug: 'blackmail', category: 'Forbidden' },
    { name: 'Forbidden Attraction', slug: 'forbidden-attraction', category: 'Forbidden' },
    { name: "Neighbour's Partner", slug: 'neighbours-partner', category: 'Forbidden' },
    // Roleplay & Scenarios
    { name: 'Stranger Encounter', slug: 'stranger-encounter', category: 'Roleplay & Scenarios' },
    { name: 'Uniform Fantasy', slug: 'uniform-fantasy', category: 'Roleplay & Scenarios' },
    { name: 'Hotel Room', slug: 'hotel-room', category: 'Roleplay & Scenarios' },
    { name: 'Hidden Identity', slug: 'hidden-identity', category: 'Roleplay & Scenarios' },
    { name: 'Delivery Worker', slug: 'delivery-worker', category: 'Roleplay & Scenarios' },
    { name: 'Fake Relationship', slug: 'fake-relationship', category: 'Roleplay & Scenarios' },
    { name: 'Revenge Fuck', slug: 'revenge-fuck', category: 'Roleplay & Scenarios' },
    { name: 'Accidental Exposure', slug: 'accidental-exposure', category: 'Roleplay & Scenarios' },
    // Intimacy & Firsts
    { name: 'First Time', slug: 'first-time', category: 'Intimacy & Firsts' },
    { name: 'Slow Seduction', slug: 'slow-seduction', category: 'Intimacy & Firsts' },
    { name: 'Virgin', slug: 'virgin', category: 'Intimacy & Firsts' },
    { name: 'Emotional Intimacy', slug: 'emotional-intimacy', category: 'Intimacy & Firsts' },
    { name: 'Secret Crush', slug: 'secret-crush', category: 'Intimacy & Firsts' },
    { name: 'Confessional', slug: 'confessional', category: 'Intimacy & Firsts' },
    // Exhibitionism
    { name: 'Being Watched', slug: 'being-watched', category: 'Exhibitionism' },
    { name: 'Voyeurism', slug: 'voyeurism', category: 'Exhibitionism' },
    { name: 'Public Risk', slug: 'public-risk', category: 'Exhibitionism' },
    { name: 'Dogging', slug: 'dogging', category: 'Exhibitionism' },
    { name: 'Flashing', slug: 'flashing', category: 'Exhibitionism' },
    { name: 'Group Dynamics', slug: 'group-dynamics', category: 'Exhibitionism' },
    // Body & Sensation
    { name: 'Breeding & Creampie', slug: 'breeding-creampie', category: 'Body & Sensation' },
    { name: 'Anal', slug: 'anal', category: 'Body & Sensation' },
    { name: 'Size Kink', slug: 'size-kink', category: 'Body & Sensation' },
    { name: 'Sensory Play', slug: 'sensory-play', category: 'Body & Sensation' },
    { name: 'Multiple Orgasms', slug: 'multiple-orgasms', category: 'Body & Sensation' },
    { name: 'Squirting', slug: 'squirting', category: 'Body & Sensation' },
    { name: 'Feet', slug: 'feet', category: 'Body & Sensation' },
    { name: 'Lactation', slug: 'lactation', category: 'Body & Sensation' },
  ]

  const ftInserts = ftData.map(({ name, slug, category }) => ({
    name,
    slug,
    category_id: fcByName[category]!,
  }))

  await db.insert(fantasyTags).values(ftInserts).onConflictDoNothing()

  const ftCount = await count(fantasyTags)
  console.log(`  fantasy_tags       : ${ftCount} rows`)

  // ── 3. mood_tags ───────────────────────────────────────────────────────────
  const mtData = [
    { name: 'Intense', slug: 'intense', emoji: '🔥' },
    { name: 'Tender', slug: 'tender', emoji: '🌙' },
    { name: 'Dark', slug: 'dark', emoji: '🖤' },
    { name: 'Forbidden', slug: 'forbidden', emoji: '🚫' },
    { name: 'Playful', slug: 'playful', emoji: '😈' },
    { name: 'Raw & Desperate', slug: 'raw-desperate', emoji: '⚡' },
    { name: 'Romantic', slug: 'romantic', emoji: '🌹' },
    { name: 'Dominant Energy', slug: 'dominant-energy', emoji: '👑' },
    { name: 'Submissive Energy', slug: 'submissive-energy', emoji: '🎀' },
    { name: 'Shameless', slug: 'shameless', emoji: '💋' },
    { name: 'Slow Build', slug: 'slow-build', emoji: '🕯️' },
    { name: 'Deviant', slug: 'deviant', emoji: '🕳️' },
    { name: 'Euphoric', slug: 'euphoric', emoji: '✨' },
    { name: 'Desperate', slug: 'desperate', emoji: '🫦' },
    { name: 'Voyeuristic', slug: 'voyeuristic', emoji: '👁️' },
    { name: 'Nostalgic', slug: 'nostalgic', emoji: '🌫️' },
  ]

  await db.insert(moodTags).values(mtData).onConflictDoNothing()
  const mtCount = await count(moodTags)
  console.log(`  mood_tags          : ${mtCount} rows`)

  // ── 4. orientation_tags ────────────────────────────────────────────────────
  const otData = [
    { name: 'MF (Straight)', slug: 'mf' },
    { name: 'FF (Lesbian)', slug: 'ff' },
    { name: 'MM (Gay)', slug: 'mm' },
    { name: 'MMF Threesome', slug: 'mmf' },
    { name: 'FFM Threesome', slug: 'ffm' },
    { name: 'Group & Gangbang', slug: 'group' },
    { name: 'Bisexual', slug: 'bisexual' },
    { name: 'Trans', slug: 'trans' },
    { name: 'Non-Binary', slug: 'non-binary' },
    { name: 'Cuckolding', slug: 'cuckolding' },
    { name: 'Hotwife', slug: 'hotwife' },
    { name: 'Solo', slug: 'solo' },
  ]

  await db.insert(orientationTags).values(otData).onConflictDoNothing()
  const otCount = await count(orientationTags)
  console.log(`  orientation_tags   : ${otCount} rows`)

  // ── 5. story_categories ────────────────────────────────────────────────────
  const scData = [
    { name: 'Confession', slug: 'confession', sort_order: 1 },
    { name: 'Erotica', slug: 'erotica', sort_order: 2 },
    { name: 'Cheating & Affairs', slug: 'cheating-affairs', sort_order: 3 },
    { name: 'Taboo & Forbidden', slug: 'taboo-forbidden', sort_order: 4 },
    { name: 'BDSM & Kink', slug: 'bdsm-kink', sort_order: 5 },
    { name: 'Incest & Step-Family', slug: 'incest-step-family', sort_order: 6 },
    { name: 'Workplace & Office', slug: 'workplace-office', sort_order: 7 },
    { name: 'College & Campus', slug: 'college-campus', sort_order: 8 },
    { name: 'One Night Stand', slug: 'one-night-stand', sort_order: 9 },
    { name: 'Group Sex', slug: 'group-sex', sort_order: 10 },
    { name: 'Cuckolding & Hotwife', slug: 'cuckolding-hotwife', sort_order: 11 },
    { name: 'Public & Exhibitionism', slug: 'public-exhibitionism', sort_order: 12 },
    { name: 'Friends & Neighbors', slug: 'friends-neighbors', sort_order: 13 },
    { name: 'Revenge & Power', slug: 'revenge-power', sort_order: 14 },
    { name: 'Audio Script', slug: 'audio-script', sort_order: 15 },
    { name: 'Slow Burn', slug: 'slow-burn', sort_order: 16 },
    { name: 'Roleplay', slug: 'roleplay', sort_order: 17 },
    { name: 'First Time', slug: 'first-time', sort_order: 18 },
  ]

  await db.insert(storyCategories).values(scData).onConflictDoNothing()
  const scCount = await count(storyCategories)
  console.log(`  story_categories   : ${scCount} rows`)

  // ── 6. vibe_tags ───────────────────────────────────────────────────────────
  const vtData = [
    { name: 'Curious', slug: 'curious', emoji: '🌀' },
    { name: 'Romantic', slug: 'romantic', emoji: '🌹' },
    { name: 'Dominant', slug: 'dominant', emoji: '👑' },
    { name: 'Submissive', slug: 'submissive', emoji: '🎀' },
    { name: 'Experimental', slug: 'experimental', emoji: '🧪' },
    { name: 'Soft & Gentle', slug: 'soft-gentle', emoji: '🕊️' },
    { name: 'Mischievous', slug: 'mischievous', emoji: '😈' },
    { name: 'Strict', slug: 'strict', emoji: '🔒' },
    { name: 'Wild', slug: 'wild', emoji: '🌊' },
    { name: 'Elegant', slug: 'elegant', emoji: '💎' },
    { name: 'Sensual', slug: 'sensual', emoji: '🌸' },
    { name: 'Bratty', slug: 'bratty', emoji: '😤' },
    { name: 'Intense', slug: 'intense', emoji: '🔥' },
    { name: 'Flirty', slug: 'flirty', emoji: '💌' },
    { name: 'Mysterious', slug: 'mysterious', emoji: '🌑' },
    { name: 'Nurturing', slug: 'nurturing', emoji: '🫂' },
    { name: 'Cerebral', slug: 'cerebral', emoji: '🧠' },
    { name: 'Radiant', slug: 'radiant', emoji: '✨' },
    { name: 'Demanding', slug: 'demanding', emoji: '💢' },
    { name: 'Spontaneous', slug: 'spontaneous', emoji: '⚡' },
  ]

  await db.insert(vibeTags).values(vtData).onConflictDoNothing()
  const vtCount = await count(vibeTags)
  console.log(`  vibe_tags          : ${vtCount} rows`)

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n✅  Seed complete.\n')
  console.log('  Table                 Rows')
  console.log('  ─────────────────────────')
  console.log(`  fantasy_categories    ${fcRows.length}`)
  console.log(`  fantasy_tags          ${ftCount}`)
  console.log(`  mood_tags             ${mtCount}`)
  console.log(`  orientation_tags      ${otCount}`)
  console.log(`  story_categories      ${scCount}`)
  console.log(`  vibe_tags             ${vtCount}`)

  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
