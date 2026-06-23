/**
 * seed-companion-photos.ts
 *
 * Downloads 4 Canva AI portraits, uploads to R2, then replaces the
 * companion_photos records for all visible companion profiles.
 *
 * Run: pnpm tsx db/seed-companion-photos.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { companions, companionProfiles, companionPhotos } from './schema'
import { eq, isNull, and, inArray } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import crypto from 'crypto'

// ── Config ────────────────────────────────────────────────────────────────────

const CANVA_EXPORTS = [
  'https://export-download.canva.com/SU4hM/DAHLveSU4hM/-1/0/0001-2441456681418761395.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260606%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260606T195217Z&X-Amz-Expires=87108&X-Amz-Signature=d8e3bc2fe1491dc568b2724abcb393a0b698369d1241124e56a03da45b826731&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Sun%2C%2007%20Jun%202026%2020%3A04%3A05%20GMT',
  'https://export-download.canva.com/jq8bs/DAHLvSjq8bs/-1/0/0001-551070737016559760.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260606%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260606T215909Z&X-Amz-Expires=81140&X-Amz-Signature=1bbf2a49f123175e51cbd304f8c37c94fa0fce4452e90036d19afdf12fbe009f&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Sun%2C%2007%20Jun%202026%2020%3A31%3A29%20GMT',
  'https://export-download.canva.com/weZJs/DAHLvdweZJs/-1/0/0001-2441456682375024968.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260607%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260607T171803Z&X-Amz-Expires=11027&X-Amz-Signature=9006efdec324944103f0b1b7749b6df12de9d93bb130c0c08f22e7d51d06ac26&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Sun%2C%2007%20Jun%202026%2020%3A21%3A50%20GMT',
  'https://export-download.canva.com/vfbn4/DAHLvavfbn4/-1/0/0001-9050489133790156944.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH5AO7UJ26%2F20260607%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260607T082606Z&X-Amz-Expires=41276&X-Amz-Signature=9a18f9afa1f7d0fcd25c593d36c12ff36f5750fd78bc1e4db69448b8f6724e8f&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Sun%2C%2007%20Jun%202026%2019%3A54%3A02%20GMT',
]

const R2_BUCKET   = process.env.R2_BUCKET_NAME!
const R2_CDN      = (process.env.NEXT_PUBLIC_R2_CDN_URL ?? '').replace(/\/$/, '')
const R2_ACCOUNT  = process.env.R2_ACCOUNT_ID!

// ── R2 client ─────────────────────────────────────────────────────────────────

const r2 = new S3Client({
  region:   'weur',
  endpoint: `https://${R2_ACCOUNT}.eu.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

// ── DB ────────────────────────────────────────────────────────────────────────

const pg  = postgres(process.env.DATABASE_URL!, { ssl: 'prefer' })
const db  = drizzle(pg)

// ── Helpers ───────────────────────────────────────────────────────────────────

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url.slice(0, 80)}`)
  return Buffer.from(await res.arrayBuffer())
}

async function uploadToR2(buf: Buffer, slug: string): Promise<{ storageKey: string; cdnUrl: string }> {
  const storageKey = `companion_photo/seed/${slug}.jpg`
  await r2.send(new PutObjectCommand({
    Bucket:      R2_BUCKET,
    Key:         storageKey,
    Body:        buf,
    ContentType: 'image/jpeg',
  }))
  return { storageKey, cdnUrl: `${R2_CDN}/${storageKey}` }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📸  BlushBite — companion photo seed\n')

  // 1. Query all companion profiles (visible only — skip hidden/test profiles)
  const profiles = await db
    .select({
      profileId: companionProfiles.id,
      name:      companions.name,
    })
    .from(companionProfiles)
    .leftJoin(companions, eq(companions.id, companionProfiles.companion_id))
    .where(eq(companionProfiles.is_visible_to_users, true))

  console.log(`Found ${profiles.length} visible companion profiles`)

  if (profiles.length === 0) {
    console.log('No visible profiles — nothing to do.')
    await pg.end()
    return
  }

  // 2. Download + upload each of the 4 Canva portraits to R2
  console.log('\nDownloading & uploading 4 Canva portraits to R2…')
  const uploaded: { storageKey: string; cdnUrl: string }[] = []

  for (let i = 0; i < CANVA_EXPORTS.length; i++) {
    process.stdout.write(`  portrait-${i + 1}… `)
    try {
      const buf    = await downloadBuffer(CANVA_EXPORTS[i])
      const result = await uploadToR2(buf, `portrait-${i + 1}`)
      uploaded.push(result)
      console.log(`✓  ${result.cdnUrl}`)
    } catch (err) {
      console.error(`✗  ${(err as Error).message}`)
      // Continue — use what we have
    }
  }

  if (uploaded.length === 0) {
    console.error('\nAll uploads failed — aborting.')
    await pg.end()
    process.exit(1)
  }

  console.log(`\nUploaded ${uploaded.length} portrait(s) to R2`)

  // 3. For each visible profile: soft-delete old photos, insert new one
  console.log('\nUpdating companion_photos in DB…')
  let inserted = 0

  for (let i = 0; i < profiles.length; i++) {
    const { profileId, name } = profiles[i]
    // Cycle through the portraits we have (4 images for 10 companions)
    const photo = uploaded[i % uploaded.length]

    // Soft-delete existing photos for this profile
    await db
      .update(companionPhotos)
      .set({ deleted_at: sql`now()` })
      .where(and(
        eq(companionPhotos.companion_profile_id, profileId),
        isNull(companionPhotos.deleted_at),
      ))

    // Insert new primary photo
    await db.insert(companionPhotos).values({
      id:                   crypto.randomUUID(),
      companion_profile_id: profileId,
      url:                  photo.cdnUrl,
      storage_key:          photo.storageKey,
      alt_text:             name ?? 'Companion portrait',
      sort_order:           0,
      is_primary:           true,
      is_approved:          true,
    })

    console.log(`  ✓  ${name ?? profileId.slice(0, 8)} → portrait-${(i % uploaded.length) + 1}`)
    inserted++
  }

  console.log(`\n✅  Done — ${inserted} companion(s) updated with AI portraits.\n`)
  await pg.end()
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err)
  process.exit(1)
})
