import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/dreamerSession'
import { db } from '@/db'
import { users, userProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { uploadBuffer, extractPublicId, deleteAsset } from '@/lib/cloudinary'

const UNAUTH = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return UNAUTH

  // Parse multipart form data
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'JPG, PNG or WebP only.' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be under 5 MB.' }, { status: 400 })
  }

  // Convert Blob → Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Fetch existing avatar URL so we can delete the old Cloudinary asset
  const [existing] = await db
    .select({ avatar_url: userProfiles.avatar_url })
    .from(userProfiles)
    .where(eq(userProfiles.user_id, session.sub))
    .limit(1)

  if (existing?.avatar_url) {
    const oldPublicId = extractPublicId(existing.avatar_url)
    if (oldPublicId) {
      // Fire and forget — don't block the response on deletion
      deleteAsset(oldPublicId, 'image').catch(() => {})
    }
  }

  // Upload to Cloudinary under blushbite/avatars/<userId>
  let avatarUrl: string
  try {
    const result = await uploadBuffer(buffer, {
      folder: 'blushbite/avatars',
      publicId: `user-${session.sub}`,
      resourceType: 'image',
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' }],
    })
    avatarUrl = result.url
  } catch {
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }

  // Upsert into user_profiles
  if (existing) {
    await db
      .update(userProfiles)
      .set({ avatar_url: avatarUrl, updated_at: new Date() })
      .where(eq(userProfiles.user_id, session.sub))
  } else {
    await db.insert(userProfiles).values({
      user_id: session.sub,
      avatar_url: avatarUrl,
    } as any)
  }

  return NextResponse.json({ data: { avatarUrl } })
}
