/**
 * seed-companion-cloudinary.ts
 *
 * 1. Uploads the 8 local companion JPGs from apps/web/public/ to Cloudinary
 * 2. Queries all visible companion profiles from DB (up to 10 test profiles)
 * 3. For each profile: soft-deletes old photos, inserts new Cloudinary URL as primary
 *
 * Run: pnpm tsx db/seed-companion-cloudinary.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { v2 as cloudinary } from 'cloudinary'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { readFileSync } from 'fs'
import { join } from 'path'
import { companions, companionProfiles, companionPhotos } from './schema'
import { eq, isNull, and } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import crypto from 'crypto'

// ── Cloudinary config ─────────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// ── DB ────────────────────────────────────────────────────────────────────────

const pg = postgres(process.env.DATABASE_URL!, { ssl: 'prefer' })
const db = drizzle(pg)

// ── Helpers ───────────────────────────────────────────────────────────────────

async function uploadLocalImage(
  localPath: string,
  publicId: string,
  folder: string
): Promise<{ url: string; publicId: string }> {
  const buffer = readFileSync(localPath)

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Upload failed'))
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    )
    stream.end(buffer)
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📸  BlushBite — Cloudinary companion photo seed\n')

  const folder = 'blushbite/companion_photos/seed'
  const publicDir = join(process.cwd(), 'public')

  // ── Step 1: Upload 8 local companion images to Cloudinary ─────────────────
  console.log('Uploading 8 companion portraits to Cloudinary...')
  const uploaded: { url: string; publicId: string }[] = []

  for (let i = 1; i <= 8; i++) {
    const localPath = join(publicDir, `companion-${i}.jpg`)
    const publicId = `companion-${i}`

    process.stdout.write(`  companion-${i}.jpg… `)
    try {
      const result = await uploadLocalImage(localPath, publicId, folder)
      uploaded.push(result)
      console.log(`✓  ${result.url}`)
    } catch (err) {
      console.error(`✗  ${(err as Error).message}`)
      // Continue with remaining
    }
  }

  if (uploaded.length === 0) {
    console.error('\nAll uploads failed — aborting.')
    await pg.end()
    process.exit(1)
  }

  console.log(`\nUploaded ${uploaded.length}/8 portrait(s) to Cloudinary`)

  // ── Step 2: Get all visible companion profiles ─────────────────────────────
  const profiles = await db
    .select({
      profileId: companionProfiles.id,
      name: companions.name,
    })
    .from(companionProfiles)
    .leftJoin(companions, eq(companions.id, companionProfiles.companion_id))
    .where(eq(companionProfiles.is_visible_to_users, true))

  console.log(`\nFound ${profiles.length} visible companion profile(s)`)

  if (profiles.length === 0) {
    console.log('No visible profiles — nothing to update in DB.')
    await pg.end()
    return
  }

  // ── Step 3: Replace photos for each profile with Cloudinary URL ───────────
  console.log('\nUpdating companion_photos in DB...')
  let updated = 0

  for (let i = 0; i < profiles.length; i++) {
    const { profileId, name } = profiles[i]
    const photo = uploaded[i % uploaded.length] // cycle through 8 images

    // Soft-delete existing photos
    await db
      .update(companionPhotos)
      .set({ deleted_at: sql`now()` })
      .where(
        and(eq(companionPhotos.companion_profile_id, profileId), isNull(companionPhotos.deleted_at))
      )

    // Insert new primary photo
    await db.insert(companionPhotos).values({
      id: crypto.randomUUID(),
      companion_profile_id: profileId,
      url: photo.url,
      storage_key: photo.publicId,
      alt_text: name ?? 'Companion portrait',
      sort_order: 0,
      is_primary: true,
      is_approved: true,
    })

    const portraitNum = (i % uploaded.length) + 1
    console.log(`  ✓  ${name ?? profileId.slice(0, 8)} → companion-${portraitNum}`)
    updated++
  }

  console.log(`\n✅  Done — ${updated} companion(s) updated with Cloudinary portraits.`)
  console.log('\nCloudinary URLs follow the pattern:')
  console.log(
    `   https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${folder}/companion-{N}.jpg\n`
  )

  await pg.end()
}

main().catch((err) => {
  console.error('\n❌ Seed failed:', err)
  process.exit(1)
})
