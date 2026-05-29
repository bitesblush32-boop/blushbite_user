/**
 * seed-companions.mjs
 * Run: DATABASE_URL="postgresql://..." node apps/web/db/seed-companions.mjs
 *
 * Seeds:
 *  1. Lookup tables: fantasy_categories, fantasy_tags, vibe_tags, languages
 *  2. 10 companion accounts + full profiles (different genders, cities, vibes)
 *  3. All with is_visible_to_users=true and profile_completeness=100
 */

import postgres from 'postgres'
import { randomUUID } from 'crypto'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable not set')
  process.exit(1)
}

const sql = postgres(DATABASE_URL, { ssl: { rejectUnauthorized: false } })

// ─── Lookup seed data ──────────────────────────────────────────────────────────

const FANTASY_CATEGORIES = [
  { name: 'Exploration',   slug: 'exploration',   sort_order: 1 },
  { name: 'Connection',    slug: 'connection',    sort_order: 2 },
  { name: 'Power',         slug: 'power',         sort_order: 3 },
  { name: 'Sensory',       slug: 'sensory',       sort_order: 4 },
  { name: 'Roleplay',      slug: 'roleplay',      sort_order: 5 },
]

const FANTASY_TAGS_BY_CATEGORY = {
  exploration: [
    { name: 'First-timer',        slug: 'first-timer' },
    { name: 'Soft exploration',   slug: 'soft-exploration' },
    { name: 'Taboo exploration',  slug: 'taboo-exploration' },
    { name: 'Voyeurism',          slug: 'voyeurism' },
    { name: 'Exhibitionism',      slug: 'exhibitionism' },
    { name: 'Experimental',       slug: 'experimental' },
  ],
  connection: [
    { name: 'Romance',              slug: 'romance' },
    { name: 'Candlelight',          slug: 'candlelight' },
    { name: 'Emotional connection', slug: 'emotional-connection' },
    { name: 'Aftercare',            slug: 'aftercare' },
    { name: 'Slow burn',            slug: 'slow-burn' },
    { name: 'Gentle touch',         slug: 'gentle-touch' },
  ],
  power: [
    { name: 'Dominance',    slug: 'dominance' },
    { name: 'Submission',   slug: 'submission' },
    { name: 'Control',      slug: 'control' },
    { name: 'Discipline',   slug: 'discipline' },
    { name: 'Light BDSM',   slug: 'light-bdsm' },
    { name: 'Trust',        slug: 'trust' },
  ],
  sensory: [
    { name: 'Sensory play',   slug: 'sensory-play' },
    { name: 'Body worship',   slug: 'body-worship' },
    { name: 'Touch',          slug: 'touch' },
    { name: 'Luxury',         slug: 'luxury' },
    { name: 'Intense',        slug: 'intense' },
    { name: 'Psychological',  slug: 'psychological' },
  ],
  roleplay: [
    { name: 'Roleplay',           slug: 'roleplay' },
    { name: 'Fantasy scenario',   slug: 'fantasy-scenario' },
    { name: 'Playful',            slug: 'playful' },
    { name: 'Mischievous',        slug: 'mischievous' },
  ],
}

const VIBE_TAGS = [
  { name: 'Romantic',     slug: 'romantic',     emoji: '🌹' },
  { name: 'Intense',      slug: 'intense',      emoji: '🔥' },
  { name: 'Gentle',       slug: 'gentle',       emoji: '🌸' },
  { name: 'Playful',      slug: 'playful',      emoji: '✨' },
  { name: 'Mysterious',   slug: 'mysterious',   emoji: '🌙' },
  { name: 'Dominant',     slug: 'dominant',     emoji: '👑' },
  { name: 'Submissive',   slug: 'submissive',   emoji: '🎀' },
  { name: 'Intellectual', slug: 'intellectual', emoji: '📖' },
  { name: 'Nurturing',    slug: 'nurturing',    emoji: '💛' },
  { name: 'Sensual',      slug: 'sensual',      emoji: '🌺' },
  { name: 'Experimental', slug: 'experimental', emoji: '🔮' },
  { name: 'Elegant',      slug: 'elegant',      emoji: '💎' },
]

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'nl', name: 'Dutch' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ja', name: 'Japanese' },
]

// ─── 10 demo companion profiles ───────────────────────────────────────────────

const COMPANIONS = [
  {
    name: 'Ava Laurent',
    email: 'ava.laurent@demo.blushbite.com',
    gender: 'woman',
    city: 'Amsterdam',
    tagline: 'Romantic & in control — your evening, your pace',
    bio: 'I believe in slow reveals and genuine attention. Whether you crave candlelight conversation or something more charged, I create a space where you feel truly seen.',
    vibe_tags: ['romantic', 'elegant', 'gentle'],
    fantasy_tag_slugs: ['romance', 'candlelight', 'slow-burn', 'emotional-connection', 'gentle-touch'],
    session_modality: 'in_person',
    hourly_rate: '280.00',
    sessions: [
      { title: 'An intimate evening', description: 'Two hours of undivided attention — conversation, connection, and whatever unfolds naturally.', price: '280.00', duration_minutes: 120, session_type: 'in_person' },
      { title: 'Extended evening', description: 'A full evening from dinner to midnight. Unhurried. Entirely yours.', price: '480.00', duration_minutes: 240, session_type: 'in_person' },
    ],
  },
  {
    name: 'Nora Voss',
    email: 'nora.voss@demo.blushbite.com',
    gender: 'woman',
    city: 'Berlin',
    tagline: 'Gentle but decisive — soft power in every moment',
    bio: 'I have a way of putting people at ease while quietly holding all the threads. Soft dominance, deep presence, a little mystery.',
    vibe_tags: ['dominant', 'mysterious', 'sensual'],
    fantasy_tag_slugs: ['dominance', 'control', 'trust', 'psychological', 'slow-burn'],
    session_modality: 'both',
    hourly_rate: '320.00',
    sessions: [
      { title: 'Private consultation', description: 'An hour of focused attention — I set the tone, you relax into it.', price: '320.00', duration_minutes: 60, session_type: 'in_person' },
      { title: 'Online session', description: 'All the presence, none of the travel. Fully immersive.', price: '180.00', duration_minutes: 60, session_type: 'video_call' },
    ],
  },
  {
    name: 'Seren Cole',
    email: 'seren.cole@demo.blushbite.com',
    gender: 'woman',
    city: 'London',
    tagline: 'Intellectual & intense — where mind meets body',
    bio: 'Conversation first, always. I find that the most charged encounters begin with genuine ideas. Then everything else follows.',
    vibe_tags: ['intellectual', 'intense', 'mysterious'],
    fantasy_tag_slugs: ['psychological', 'trust', 'intense', 'taboo-exploration', 'roleplay'],
    session_modality: 'in_person',
    hourly_rate: '350.00',
    sessions: [
      { title: 'Mind & body session', description: 'We start with a drink and conversation. Where it leads is entirely organic.', price: '350.00', duration_minutes: 90, session_type: 'in_person' },
    ],
  },
  {
    name: 'Kai Nakamura',
    email: 'kai.nakamura@demo.blushbite.com',
    gender: 'man',
    city: 'Paris',
    tagline: 'Warm, present, and entirely unhurried',
    bio: 'No rush. No performance. Just real attention and a calm that tends to spread to everyone around me. I specialise in making people feel genuinely held.',
    vibe_tags: ['gentle', 'nurturing', 'romantic'],
    fantasy_tag_slugs: ['aftercare', 'emotional-connection', 'gentle-touch', 'romance', 'trust'],
    session_modality: 'both',
    hourly_rate: '260.00',
    sessions: [
      { title: 'Afternoon session', description: 'Three hours of warmth, attention, and genuine care.', price: '260.00', duration_minutes: 180, session_type: 'in_person' },
      { title: 'Virtual presence', description: 'A one-hour online session — I am fully present even through a screen.', price: '120.00', duration_minutes: 60, session_type: 'video_call' },
    ],
  },
  {
    name: 'Maëve Delacroix',
    email: 'maeve.delacroix@demo.blushbite.com',
    gender: 'woman',
    city: 'Paris',
    tagline: 'Mysterious & precise — luxury delivered quietly',
    bio: 'I do not announce what I am going to do. I simply do it, perfectly. Power dynamics, sensory attention, an evening you will not quite be able to describe to anyone.',
    vibe_tags: ['dominant', 'elegant', 'experimental'],
    fantasy_tag_slugs: ['dominance', 'discipline', 'luxury', 'sensory-play', 'body-worship', 'light-bdsm'],
    session_modality: 'in_person',
    hourly_rate: '400.00',
    sessions: [
      { title: 'The full experience', description: 'An evening of total focus. I run the evening. You receive it.', price: '400.00', duration_minutes: 180, session_type: 'in_person' },
    ],
  },
  {
    name: 'Irina Volkov',
    email: 'irina.volkov@demo.blushbite.com',
    gender: 'woman',
    city: 'Amsterdam',
    tagline: 'Playful & confident — she sets the temperature',
    bio: 'Light, fun, a little dangerous. I love the unexpected pivot, the surprise, the moment you realise this evening is not what you planned and it is perfect.',
    vibe_tags: ['playful', 'experimental', 'sensual'],
    fantasy_tag_slugs: ['roleplay', 'fantasy-scenario', 'playful', 'exhibitionism', 'experimental'],
    session_modality: 'in_person',
    hourly_rate: '290.00',
    sessions: [
      { title: 'Play session', description: 'Two hours of improvised, creative, delightful mischief.', price: '290.00', duration_minutes: 120, session_type: 'in_person' },
    ],
  },
  {
    name: 'Alex Morgan',
    email: 'alex.morgan@demo.blushbite.com',
    gender: 'non_binary',
    city: 'Amsterdam',
    tagline: 'Fluid, curious, and entirely without judgment',
    bio: 'I move between presence and playfulness with ease. Non-binary in form and approach — I meet each person exactly where they are.',
    vibe_tags: ['playful', 'gentle', 'intellectual'],
    fantasy_tag_slugs: ['soft-exploration', 'first-timer', 'emotional-connection', 'gentle-touch', 'voyeurism'],
    session_modality: 'online',
    hourly_rate: '200.00',
    sessions: [
      { title: 'Online connection', description: 'An hour of real conversation and presence — no pressure, only curiosity.', price: '200.00', duration_minutes: 60, session_type: 'video_call' },
    ],
  },
  {
    name: 'Dante Ferri',
    email: 'dante.ferri@demo.blushbite.com',
    gender: 'man',
    city: 'Milan',
    tagline: 'Intense, direct, deeply attentive',
    bio: 'I am not for everyone. For those I am for, there is nothing else. Intensity, complete attention, and a kind of presence that is hard to articulate after.',
    vibe_tags: ['intense', 'dominant', 'sensual'],
    fantasy_tag_slugs: ['intense', 'dominance', 'body-worship', 'submission', 'trust'],
    session_modality: 'in_person',
    hourly_rate: '380.00',
    sessions: [
      { title: 'Intensive evening', description: 'Three hours of complete, undivided intensity. Not for the uncertain.', price: '380.00', duration_minutes: 180, session_type: 'in_person' },
    ],
  },
  {
    name: 'Sofia Belić',
    email: 'sofia.belic@demo.blushbite.com',
    gender: 'trans_woman',
    city: 'Vienna',
    tagline: 'Warm authority and deep understanding',
    bio: 'I have lived in many worlds. That experience translates into extraordinary empathy and a rare ability to hold space without judgment. I tend to be exactly what someone needs.',
    vibe_tags: ['nurturing', 'romantic', 'intellectual'],
    fantasy_tag_slugs: ['emotional-connection', 'aftercare', 'romance', 'trust', 'soft-exploration'],
    session_modality: 'both',
    hourly_rate: '310.00',
    sessions: [
      { title: 'Afternoon with Sofia', description: 'Long, warm, entirely unhurried. Exactly the kind of afternoon you needed.', price: '310.00', duration_minutes: 150, session_type: 'in_person' },
      { title: 'Online session', description: 'Sixty minutes of genuine connection — presence without location.', price: '140.00', duration_minutes: 60, session_type: 'video_call' },
    ],
  },
  {
    name: 'Lena Hofer',
    email: 'lena.hofer@demo.blushbite.com',
    gender: 'woman',
    city: 'Vienna',
    tagline: 'Sensory, slow, and devastatingly present',
    bio: 'Touch is my language. Slow, deliberate, attentive. I believe the most powerful experiences are the ones that build so gradually you only realise afterwards how completely you surrendered.',
    vibe_tags: ['sensual', 'elegant', 'gentle'],
    fantasy_tag_slugs: ['sensory-play', 'body-worship', 'touch', 'gentle-touch', 'slow-burn', 'luxury'],
    session_modality: 'in_person',
    hourly_rate: '340.00',
    sessions: [
      { title: 'Sensory evening', description: 'Two hours of total sensory focus. You arrive tense. You leave changed.', price: '340.00', duration_minutes: 120, session_type: 'in_person' },
    ],
  },
]

// ─── Main seed function ───────────────────────────────────────────────────────

async function seed() {
  console.log('──────────────────────────────────────────')
  console.log('BlushBite companion seed script')
  console.log('──────────────────────────────────────────')

  // ── 1. Seed lookup tables ─────────────────────────────────────────────────

  console.log('\n[1/4] Seeding lookup tables...')

  // Languages
  for (const lang of LANGUAGES) {
    await sql`
      INSERT INTO languages (code, name)
      VALUES (${lang.code}, ${lang.name})
      ON CONFLICT (code) DO NOTHING
    `
  }
  console.log(`  ✓ ${LANGUAGES.length} languages`)

  // Vibe tags
  for (const tag of VIBE_TAGS) {
    await sql`
      INSERT INTO vibe_tags (name, slug, emoji, is_active)
      VALUES (${tag.name}, ${tag.slug}, ${tag.emoji}, true)
      ON CONFLICT (slug) DO NOTHING
    `
  }
  console.log(`  ✓ ${VIBE_TAGS.length} vibe tags`)

  // Fantasy categories
  const categoryIdMap = {}
  for (const cat of FANTASY_CATEGORIES) {
    const [row] = await sql`
      INSERT INTO fantasy_categories (name, slug, sort_order, is_active)
      VALUES (${cat.name}, ${cat.slug}, ${cat.sort_order}, true)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `
    categoryIdMap[cat.slug] = row.id
  }
  console.log(`  ✓ ${FANTASY_CATEGORIES.length} fantasy categories`)

  // Fantasy tags
  const tagSlugToId = {}
  for (const [catSlug, tags] of Object.entries(FANTASY_TAGS_BY_CATEGORY)) {
    const catId = categoryIdMap[catSlug]
    if (!catId) continue
    for (const tag of tags) {
      const [row] = await sql`
        INSERT INTO fantasy_tags (category_id, name, slug, is_active)
        VALUES (${catId}, ${tag.name}, ${tag.slug}, true)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `
      tagSlugToId[tag.slug] = row.id
    }
  }
  const totalTags = Object.values(FANTASY_TAGS_BY_CATEGORY).reduce((n, arr) => n + arr.length, 0)
  console.log(`  ✓ ${totalTags} fantasy tags`)

  // Vibe tag slug → id map
  const vibeTagRows = await sql`SELECT id, slug FROM vibe_tags`
  const vibeSlugToId = {}
  for (const r of vibeTagRows) vibeSlugToId[r.slug] = r.id

  // ── 2. Seed companions ────────────────────────────────────────────────────

  console.log('\n[2/4] Seeding companion accounts...')

  for (const comp of COMPANIONS) {
    const companionId = randomUUID()

    // Check if companion already exists
    const [existing] = await sql`SELECT id FROM companions WHERE email = ${comp.email}`
    let cId = existing?.id

    if (!cId) {
      const [c] = await sql`
        INSERT INTO companions (
          id, email, name, onboarding_complete, full_name,
          companion_stage, created_at, updated_at
        ) VALUES (
          ${companionId}, ${comp.email}, ${comp.name.split(' ')[0]}, true, ${comp.name},
          7, NOW(), NOW()
        )
        RETURNING id
      `
      cId = c.id
    }

    // Check if profile already exists
    const [existingProfile] = await sql`SELECT id FROM companion_profiles WHERE companion_id = ${cId}`
    let profileId = existingProfile?.id

    if (!profileId) {
      const [profile] = await sql`
        INSERT INTO companion_profiles (
          companion_id, bio, tagline, city, hourly_rate, currency,
          gender, session_modality, is_verified, is_live,
          is_visible_to_users, profile_completeness,
          approved_at, created_at, updated_at
        ) VALUES (
          ${cId}, ${comp.bio}, ${comp.tagline}, ${comp.city},
          ${comp.hourly_rate}, 'EUR',
          ${comp.gender}, ${comp.session_modality},
          true, true, true, 100,
          NOW(), NOW(), NOW()
        )
        RETURNING id
      `
      profileId = profile.id
    } else {
      // Update to ensure visible
      await sql`
        UPDATE companion_profiles SET
          bio = ${comp.bio}, tagline = ${comp.tagline}, city = ${comp.city},
          gender = ${comp.gender}, session_modality = ${comp.session_modality},
          is_visible_to_users = true, is_live = true,
          profile_completeness = 100, updated_at = NOW()
        WHERE id = ${profileId}
      `
    }

    // Vibe tags
    for (const slug of comp.vibe_tags) {
      const vibeTagId = vibeSlugToId[slug]
      if (!vibeTagId) continue
      await sql`
        INSERT INTO companion_vibe_tags (companion_profile_id, vibe_tag_id)
        VALUES (${profileId}, ${vibeTagId})
        ON CONFLICT DO NOTHING
      `
    }

    // Fantasy tags
    for (const slug of comp.fantasy_tag_slugs) {
      const tagId = tagSlugToId[slug]
      if (!tagId) continue
      await sql`
        INSERT INTO companion_fantasy_tags (companion_profile_id, fantasy_tag_id)
        VALUES (${profileId}, ${tagId})
        ON CONFLICT DO NOTHING
      `
    }

    // Session cards
    await sql`DELETE FROM session_cards WHERE companion_profile_id = ${profileId}`
    for (let i = 0; i < comp.sessions.length; i++) {
      const s = comp.sessions[i]
      await sql`
        INSERT INTO session_cards (
          companion_profile_id, title, description,
          duration_minutes, price, currency, session_type, is_active, sort_order
        ) VALUES (
          ${profileId}, ${s.title}, ${s.description},
          ${s.duration_minutes}, ${s.price}, 'EUR', ${s.session_type}, true, ${i}
        )
      `
    }

    // English language
    const [langRow] = await sql`SELECT id FROM languages WHERE code = 'en'`
    if (langRow) {
      await sql`
        INSERT INTO companion_languages (companion_profile_id, language_id, fluency)
        VALUES (${profileId}, ${langRow.id}, 'native')
        ON CONFLICT DO NOTHING
      `
    }

    console.log(`  ✓ ${comp.name} (${comp.gender}, ${comp.city})`)
  }

  // ── 3. Summary ───────────────────────────────────────────────────────────

  console.log('\n[3/4] Verifying seeded data...')
  const [{ count: compCount }] = await sql`SELECT COUNT(*) as count FROM companions WHERE email LIKE '%@demo.blushbite.com'`
  const [{ count: profileCount }] = await sql`SELECT COUNT(*) as count FROM companion_profiles WHERE is_visible_to_users = true`
  const [{ count: sessionCount }] = await sql`SELECT COUNT(*) as count FROM session_cards WHERE deleted_at IS NULL`
  console.log(`  ✓ ${compCount} demo companions`)
  console.log(`  ✓ ${profileCount} visible profiles`)
  console.log(`  ✓ ${sessionCount} session cards`)

  console.log('\n[4/4] Seed complete.')
  console.log('──────────────────────────────────────────')
  console.log('Test the feed: curl -b "next-auth.session-token=..." http://localhost:3000/api/companions/feed')
  console.log('──────────────────────────────────────────')

  await sql.end()
}

seed().catch(err => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
