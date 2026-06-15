import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { userProfiles } from '@/db/schema'
import { uploadBuffer, deleteAsset, extractPublicId } from '@/lib/cloudinary'

const MAX_BYTES     = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// ─── POST /api/users/avatar ───────────────────────────────────────────────────

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
    return NextResponse.json({ error: 'Only JPG, PNG, and WebP images are accepted.' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Image is too large — please keep it under 5 MB.' },
      { status: 400 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // ─── Upload to Cloudinary with face-aware crop ─────────────────────────────
  // Cloudinary handles resize + crop server-side — no sharp needed
  const { url: avatarUrl } = await uploadBuffer(buffer, {
    folder:        `blushbite/avatars/${userId}`,
    resourceType:  'image',
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' }],
  })

  const now = new Date()

  await db
    .insert(userProfiles)
    .values({ user_id: userId, avatar_url: avatarUrl, updated_at: now })
    .onConflictDoUpdate({
      target: userProfiles.user_id,
      set:    { avatar_url: avatarUrl, updated_at: now },
    })

  return NextResponse.json({ data: { avatarUrl } })
}

// ─── DELETE /api/users/avatar ─────────────────────────────────────────────────

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const rows = await db
    .select({ avatar_url: userProfiles.avatar_url })
    .from(userProfiles)
    .where(eq(userProfiles.user_id, userId))
    .limit(1)

  const existing = rows[0]?.avatar_url

  // Delete from Cloudinary if it's one of ours
  if (existing?.includes('res.cloudinary.com')) {
    const publicId = extractPublicId(existing)
    if (publicId) {
      try {
        await deleteAsset(publicId, 'image')
      } catch {
        // Non-fatal — continue to clear DB row even if Cloudinary delete fails
      }
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
