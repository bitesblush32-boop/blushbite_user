/**
 * update-companions-physical.mjs
 * Run: DATABASE_URL="postgresql://..." node apps/web/db/update-companions-physical.mjs
 *
 * Updates the 10 seeded demo companions with:
 *   - latitude / longitude (city centre coordinates)
 *   - height_cm, body_type, ethnicity, eye_color, hair_color, skin_color
 *   - session_modality, whatsapp_number, instagram_handle, website_url
 */

import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable not set')
  process.exit(1)
}

const sql = postgres(DATABASE_URL, { ssl: { rejectUnauthorized: false } })

// City centre coordinates
const CITY_COORDS = {
  Amsterdam: { lat: 52.3676, lng: 4.9041 },
  Berlin:    { lat: 52.5200, lng: 13.4050 },
  London:    { lat: 51.5074, lng: -0.1278 },
  Paris:     { lat: 48.8566, lng: 2.3522 },
  Milan:     { lat: 45.4642, lng: 9.1900 },
  Vienna:    { lat: 48.2082, lng: 16.3738 },
}

// Physical data per companion (keyed by email)
const PHYSICAL_DATA = {
  'ava.laurent@demo.blushbite.com': {
    city: 'Amsterdam',
    height_cm: 168, body_type: 'slim', ethnicity: 'Caucasian',
    eye_color: 'blue', hair_color: 'blonde', skin_color: 'fair',
    session_modality: 'in_person',
    whatsapp_number: '+31612345601',
    instagram_handle: 'ava.laurent.bb',
    website_url: null,
  },
  'nora.voss@demo.blushbite.com': {
    city: 'Berlin',
    height_cm: 172, body_type: 'athletic', ethnicity: 'Caucasian',
    eye_color: 'green', hair_color: 'brown', skin_color: 'light',
    session_modality: 'both',
    whatsapp_number: '+49151234560',
    instagram_handle: 'nora.voss.bb',
    website_url: null,
  },
  'seren.cole@demo.blushbite.com': {
    city: 'London',
    height_cm: 165, body_type: 'curvy', ethnicity: 'Mixed',
    eye_color: 'hazel', hair_color: 'dark', skin_color: 'medium',
    session_modality: 'in_person',
    whatsapp_number: '+447712345601',
    instagram_handle: 'seren.cole.bb',
    website_url: null,
  },
  'kai.nakamura@demo.blushbite.com': {
    city: 'Paris',
    height_cm: 183, body_type: 'athletic', ethnicity: 'Asian',
    eye_color: 'brown', hair_color: 'black', skin_color: 'medium',
    session_modality: 'both',
    whatsapp_number: '+33612345601',
    instagram_handle: 'kai.nakamura.bb',
    website_url: null,
  },
  'maeve.delacroix@demo.blushbite.com': {
    city: 'Paris',
    height_cm: 170, body_type: 'slim', ethnicity: 'Caucasian',
    eye_color: 'grey', hair_color: 'auburn', skin_color: 'fair',
    session_modality: 'in_person',
    whatsapp_number: '+33612345602',
    instagram_handle: 'maeve.delacroix.bb',
    website_url: null,
  },
  'irina.volkov@demo.blushbite.com': {
    city: 'Amsterdam',
    height_cm: 162, body_type: 'slim', ethnicity: 'Eastern European',
    eye_color: 'brown', hair_color: 'blonde', skin_color: 'light',
    session_modality: 'in_person',
    whatsapp_number: '+31612345602',
    instagram_handle: 'irina.volkov.bb',
    website_url: null,
  },
  'alex.morgan@demo.blushbite.com': {
    city: 'Amsterdam',
    height_cm: 175, body_type: 'average', ethnicity: 'Mixed',
    eye_color: 'blue', hair_color: 'brown', skin_color: 'medium',
    session_modality: 'online',
    whatsapp_number: '+31612345603',
    instagram_handle: 'alex.morgan.bb',
    website_url: null,
  },
  'dante.ferri@demo.blushbite.com': {
    city: 'Milan',
    height_cm: 185, body_type: 'athletic', ethnicity: 'Mediterranean',
    eye_color: 'brown', hair_color: 'dark', skin_color: 'olive',
    session_modality: 'in_person',
    whatsapp_number: '+39312345601',
    instagram_handle: 'dante.ferri.bb',
    website_url: null,
  },
  'sofia.belic@demo.blushbite.com': {
    city: 'Vienna',
    height_cm: 169, body_type: 'slim', ethnicity: 'Eastern European',
    eye_color: 'brown', hair_color: 'black', skin_color: 'medium',
    session_modality: 'both',
    whatsapp_number: '+43664345601',
    instagram_handle: 'sofia.belic.bb',
    website_url: null,
  },
  'lena.hofer@demo.blushbite.com': {
    city: 'Vienna',
    height_cm: 167, body_type: 'athletic', ethnicity: 'Nordic',
    eye_color: 'blue', hair_color: 'blonde', skin_color: 'fair',
    session_modality: 'in_person',
    whatsapp_number: '+43664345602',
    instagram_handle: 'lena.hofer.bb',
    website_url: null,
  },
}

async function updatePhysicalData() {
  console.log('──────────────────────────────────────────')
  console.log('BlushBite companion physical data update')
  console.log('──────────────────────────────────────────')

  let updated = 0
  let skipped = 0

  for (const [email, data] of Object.entries(PHYSICAL_DATA)) {
    // Get companion + profile
    const [companionRow] = await sql`SELECT id FROM companions WHERE email = ${email}`
    if (!companionRow) {
      console.log(`  SKIP ${email} — companion not found`)
      skipped++
      continue
    }

    const [profileRow] = await sql`
      SELECT id FROM companion_profiles WHERE companion_id = ${companionRow.id}
    `
    if (!profileRow) {
      console.log(`  SKIP ${email} — no profile`)
      skipped++
      continue
    }

    const coords = CITY_COORDS[data.city]
    if (!coords) {
      console.log(`  SKIP ${email} — unknown city: ${data.city}`)
      skipped++
      continue
    }

    await sql`
      UPDATE companion_profiles SET
        latitude         = ${coords.lat},
        longitude        = ${coords.lng},
        height_cm        = ${data.height_cm},
        body_type        = ${data.body_type},
        ethnicity        = ${data.ethnicity},
        eye_color        = ${data.eye_color},
        hair_color       = ${data.hair_color},
        skin_color       = ${data.skin_color},
        session_modality = ${data.session_modality},
        whatsapp_number  = ${data.whatsapp_number},
        instagram_handle = ${data.instagram_handle},
        website_url      = ${data.website_url},
        updated_at       = NOW()
      WHERE id = ${profileRow.id}
    `

    console.log(`  ✓ ${email.split('@')[0].replace('.', ' ')} (${data.city}) — ${data.body_type}, ${data.height_cm}cm`)
    updated++
  }

  console.log(`\n${updated} companions updated, ${skipped} skipped.`)
  console.log('──────────────────────────────────────────')

  await sql.end()
}

updatePhysicalData().catch(err => {
  console.error('Update failed:', err.message)
  process.exit(1)
})
