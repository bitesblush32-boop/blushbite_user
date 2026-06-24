/**
 * Seed 5 verified Indian companion profiles into the DB.
 * Run from apps/web/:
 *   npx tsx --env-file .env.local scripts/seed-indian-companions.ts
 */

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import {
  companions,
  companionProfiles,
  companionPhotos,
  sessionCards,
  vibeTags,
  companionVibeTags,
} from '../db/schema'
import { eq, inArray } from 'drizzle-orm'

const CDN = 'https://res.cloudinary.com/dqq7cjhmt/image/upload/blushbite/companion_photos/seed'

const PROFILES = [
  {
    // companions row
    email:         'priya.seed@blushbite.internal',
    name:          'Priya',
    alias:         '@velvet-priya',
    full_name:     'Priya Sharma',
    date_of_birth: '1998-03-14',
    country:       'India',
    // companion_profiles row
    tagline:       'Every evening with me is a story worth telling.',
    bio:           'Warm, unhurried, and entirely present. I love slow conversations that go nowhere and everywhere at once. Mumbai-born, world-curious.',
    city:          'Mumbai',
    hourly_rate:   '280',
    gender:        'woman',
    height_cm:     163,
    body_type:     'slim',
    ethnicity:     'South Asian',
    eye_color:     'brown',
    hair_color:    'black',
    skin_color:    'medium',
    session_modality: 'online',
    // photo
    photoIndex:    1,
    // session card
    sessionTitle:  'An evening conversation',
    sessionType:   'audio_call',
    sessionMins:   60,
    sessionPrice:  '280',
    // vibe tags (matched by name)
    vibeNames:     ['Romantic', 'Slow burn', 'Intimate'],
  },
  {
    email:         'anika.seed@blushbite.internal',
    name:          'Anika',
    alias:         '@midnight-anika',
    full_name:     'Anika Verma',
    date_of_birth: '1995-07-22',
    country:       'India',
    tagline:       'I see you. The real you.',
    bio:           'I have a way of making people feel seen. Delhi girl with a poet\'s heart and a listener\'s patience. Tell me something true.',
    city:          'Delhi',
    hourly_rate:   '320',
    gender:        'woman',
    height_cm:     168,
    body_type:     'average',
    ethnicity:     'South Asian',
    eye_color:     'brown',
    hair_color:    'black',
    skin_color:    'olive',
    session_modality: 'online',
    photoIndex:    2,
    sessionTitle:  'Private confessions',
    sessionType:   'audio_call',
    sessionMins:   45,
    sessionPrice:  '240',
    vibeNames:     ['Confessions', 'Intense', 'Gentle'],
  },
  {
    email:         'meera.seed@blushbite.internal',
    name:          'Meera',
    alias:         '@still-meera',
    full_name:     'Meera Nair',
    date_of_birth: '2000-11-05',
    country:       'India',
    tagline:       'Slow down. Stay a while.',
    bio:           'Bangalore nights are long and so are my stories. I speak softly and mean everything I say. No rush, no performance.',
    city:          'Bangalore',
    hourly_rate:   '260',
    gender:        'woman',
    height_cm:     160,
    body_type:     'slim',
    ethnicity:     'South Asian',
    eye_color:     'brown',
    hair_color:    'black',
    skin_color:    'brown',
    session_modality: 'online',
    photoIndex:    3,
    sessionTitle:  'Soft hours',
    sessionType:   'chat',
    sessionMins:   60,
    sessionPrice:  '200',
    vibeNames:     ['Gentle', 'Slow burn', 'Romantic'],
  },
  {
    email:         'kavya.seed@blushbite.internal',
    name:          'Kavya',
    alias:         '@golden-kavya',
    full_name:     'Kavya Reddy',
    date_of_birth: '1993-01-30',
    country:       'India',
    tagline:       'Desire deserves elegance.',
    bio:           'I am precise, deliberate, and deeply sensual. Kolkata gave me my love of art and literature. I bring that same depth to every encounter.',
    city:          'Kolkata',
    hourly_rate:   '380',
    gender:        'woman',
    height_cm:     165,
    body_type:     'curvy',
    ethnicity:     'South Asian',
    eye_color:     'brown',
    hair_color:    'black',
    skin_color:    'medium',
    session_modality: 'both',
    photoIndex:    4,
    sessionTitle:  'The full experience',
    sessionType:   'video_call',
    sessionMins:   90,
    sessionPrice:  '380',
    vibeNames:     ['Intense', 'Dominant energy', 'Luxury'],
  },
  {
    email:         'zara.seed@blushbite.internal',
    name:          'Zara',
    alias:         '@sparkling-zara',
    full_name:     'Zara Khan',
    date_of_birth: '1997-09-18',
    country:       'India',
    tagline:       'I make the ordinary feel extraordinary.',
    bio:           'Pune-raised, endlessly curious. I find magic in ordinary moments and turn them into something you\'ll think about long after.',
    city:          'Pune',
    hourly_rate:   '300',
    gender:        'woman',
    height_cm:     162,
    body_type:     'athletic',
    ethnicity:     'South Asian',
    eye_color:     'brown',
    hair_color:    'black',
    skin_color:    'olive',
    session_modality: 'online',
    photoIndex:    5,
    sessionTitle:  'Something unexpected',
    sessionType:   'audio_call',
    sessionMins:   60,
    sessionPrice:  '300',
    vibeNames:     ['Playful', 'Roleplay', 'Light touch'],
  },
]

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 })
  const db = drizzle(client)

  console.log('Seeding 5 Indian companion profiles...\n')

  // Resolve vibe tag IDs for all unique vibe names we need
  const allVibeNames = Array.from(new Set(PROFILES.flatMap(p => p.vibeNames)))
  const existingVibeTags = await db
    .select({ id: vibeTags.id, name: vibeTags.name })
    .from(vibeTags)
    .where(inArray(vibeTags.name, allVibeNames))
  const vibeTagMap = new Map(existingVibeTags.map(v => [v.name, v.id]))
  console.log(`Found ${existingVibeTags.length}/${allVibeNames.length} vibe tags in DB`)

  for (const p of PROFILES) {
    // Skip if already seeded (idempotent)
    const existing = await db
      .select({ id: companions.id })
      .from(companions)
      .where(eq(companions.email, p.email))
      .limit(1)

    if (existing.length > 0) {
      console.log(`  Skipping ${p.name} — already exists`)
      continue
    }

    // 1. Insert companion (auth row)
    const [comp] = await db.insert(companions).values({
      email:               p.email,
      name:                p.name,
      alias:               p.alias,
      full_name:           p.full_name,
      date_of_birth:       p.date_of_birth,
      country:             p.country,
      onboarding_complete: true,
      companion_stage:     7,
    }).returning({ id: companions.id })

    // 2. Insert companion_profile
    const now = new Date()
    const [profile] = await db.insert(companionProfiles).values({
      companion_id:         comp.id,
      bio:                  p.bio,
      tagline:              p.tagline,
      city:                 p.city,
      hourly_rate:          p.hourly_rate,
      currency:             'EUR',
      availability_status:  'available',
      is_verified:          true,
      verified_at:          now,
      is_live:              true,
      approved_at:          now,
      is_visible_to_users:  true,
      profile_completeness: 100,
      gender:               p.gender,
      height_cm:            p.height_cm,
      body_type:            p.body_type,
      ethnicity:            p.ethnicity,
      eye_color:            p.eye_color,
      hair_color:           p.hair_color,
      skin_color:           p.skin_color,
      session_modality:     p.session_modality,
    }).returning({ id: companionProfiles.id })

    // 3. Insert primary photo
    const photoUrl = `${CDN}/companion-${p.photoIndex}.jpg`
    await db.insert(companionPhotos).values({
      companion_profile_id: profile.id,
      url:                  photoUrl,
      storage_key:          `blushbite/companion_photos/seed/companion-${p.photoIndex}.jpg`,
      alt_text:             `${p.name}'s profile photo`,
      sort_order:           0,
      is_primary:           true,
      is_approved:          true,
    })

    // 4. Insert session card
    await db.insert(sessionCards).values({
      companion_profile_id: profile.id,
      title:                p.sessionTitle,
      duration_minutes:     p.sessionMins,
      price:                p.sessionPrice,
      currency:             'EUR',
      session_type:         p.sessionType,
      is_active:            true,
      sort_order:           0,
    })

    // 5. Insert vibe tags (skip any not found in DB)
    const vibeTagInserts = p.vibeNames
      .map(name => vibeTagMap.get(name))
      .filter((id): id is number => id !== undefined)

    if (vibeTagInserts.length > 0) {
      await db.insert(companionVibeTags).values(
        vibeTagInserts.map(tagId => ({
          companion_profile_id: profile.id,
          vibe_tag_id:          tagId,
        }))
      )
    }

    console.log(`  ✓ ${p.name} (${p.city}) — profile_id: ${profile.id}`)
  }

  console.log('\nDone. Visit /home to see the profiles.')
  await client.end()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
