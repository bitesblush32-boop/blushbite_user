import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { companionProfiles, companionPhotos } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { photo_id, action } = await req.json()
  if (!photo_id || !action) {
    return NextResponse.json({ error: 'photo_id and action required' }, { status: 400 })
  }

  const [profile] = await db
    .select({ id: companionProfiles.id })
    .from(companionProfiles)
    .where(eq(companionProfiles.companion_id, params.id))
    .limit(1)

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  if (action === 'approve') {
    await db
      .update(companionPhotos)
      .set({ is_approved: true })
      .where(eq(companionPhotos.id, photo_id))
  } else if (action === 'reject') {
    await db
      .update(companionPhotos)
      .set({ deleted_at: new Date() })
      .where(eq(companionPhotos.id, photo_id))
  } else if (action === 'set_primary') {
    await db
      .update(companionPhotos)
      .set({ is_primary: false })
      .where(eq(companionPhotos.companion_profile_id, profile.id))
    await db
      .update(companionPhotos)
      .set({ is_primary: true })
      .where(eq(companionPhotos.id, photo_id))
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
