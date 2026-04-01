import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { auth } from '@/auth'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { userProfiles } from '@/db/schema'
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2'

const MAX_BYTES       = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES   = ['image/jpeg', 'image/png']

// ─── POST /api/user/avatar ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Something slipped — try sending again.' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG and PNG images are accepted.' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Image is too large — please keep it under 5 MB.' },
      { status: 400 },
    )
  }

  // Convert to Buffer
  const buffer = Buffer.from(await file.arrayBuffer())

  // Resize + compress to WebP 400×400
  const processed = await sharp(buffer)
    .resize(400, 400, { fit: 'cover', position: 'center' })
    .webp({ quality: 82 })
    .toBuffer()

  // Build storage key
  const key = `avatars/${userId}/${Date.now()}.webp`

  // Upload to R2
  await r2.send(new PutObjectCommand({
    Bucket:       R2_BUCKET,
    Key:          key,
    Body:         processed,
    ContentType:  'image/webp',
    CacheControl: 'public, max-age=31536000, immutable',
  }))

  const avatarUrl = `${R2_PUBLIC_URL}/${key}`
  const now       = new Date()

  // Upsert user_profiles.avatar_url
  await db
    .insert(userProfiles)
    .values({ user_id: userId, avatar_url: avatarUrl, updated_at: now })
    .onConflictDoUpdate({
      target: userProfiles.user_id,
      set:    { avatar_url: avatarUrl, updated_at: now },
    })

  return NextResponse.json({ data: { avatarUrl } })
}

// ─── DELETE /api/user/avatar ──────────────────────────────────────────────────

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Fetch existing avatar_url
  const rows = await db
    .select({ avatar_url: userProfiles.avatar_url })
    .from(userProfiles)
    .where(eq(userProfiles.user_id, userId))
    .limit(1)

  const existing = rows[0]?.avatar_url

  // Delete from R2 if it is one of ours
  if (existing?.startsWith(R2_PUBLIC_URL)) {
    const key = existing.slice(R2_PUBLIC_URL.length + 1) // strip leading slash
    try {
      await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    } catch {
      // Non-fatal — continue to clear DB row even if R2 delete fails
    }
  }

  const now = new Date()
  await db
    .insert(userProfiles)
    .values({ user_id: userId, avatar_url: null, updated_at: now })
    .onConflictDoUpdate({
      target: userProfiles.user_id,
      set:    { avatar_url: null, updated_at: now },
    })

  return NextResponse.json({ data: { ok: true } })
}
