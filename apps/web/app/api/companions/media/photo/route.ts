import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionProfiles, companionPhotos } from '@/db/schema'
import { eq, isNull, count } from 'drizzle-orm'

const bodySchema = z.object({
  url:         z.string().url(),
  storage_key: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const raw = await req.json().catch(() => null)
    const result = bodySchema.safeParse(raw)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }
    const { url, storage_key } = result.data

    // Find companion
    const companion = await db.query.companions.findFirst({
      where: eq(companions.email, session.user.email),
      columns: { id: true },
    })
    if (!companion) {
      return NextResponse.json({ error: 'Not a companion' }, { status: 403 })
    }

    // Find or create companion_profile
    let profile = await db.query.companionProfiles.findFirst({
      where: eq(companionProfiles.companion_id, companion.id),
      columns: { id: true },
    })
    if (!profile) {
      const [created] = await db
        .insert(companionProfiles)
        .values({ companion_id: companion.id })
        .onConflictDoNothing()
        .returning({ id: companionProfiles.id })
      profile = created ?? await db.query.companionProfiles.findFirst({
        where: eq(companionProfiles.companion_id, companion.id),
        columns: { id: true },
      })
    }
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 500 })
    }

    // Get next sort_order
    const existing = await db
      .select({ count: count() })
      .from(companionPhotos)
      .where(eq(companionPhotos.companion_profile_id, profile.id))
    const sortOrder = existing[0]?.count ?? 0

    const [photo] = await db
      .insert(companionPhotos)
      .values({
        companion_profile_id: profile.id,
        url,
        storage_key,
        is_approved: false,
        sort_order:  sortOrder,
      })
      .returning({ id: companionPhotos.id })

    return NextResponse.json({ success: true, photo_id: photo.id })
  } catch (err) {
    console.error('[POST /api/companions/media/photo]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
