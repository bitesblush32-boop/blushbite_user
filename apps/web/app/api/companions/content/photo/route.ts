import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionProfiles, companionPhotos } from '@/db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })
  if (!companion) return NextResponse.json({ error: 'Not a companion' }, { status: 403 })

  const profile = await db.query.companionProfiles.findFirst({
    where: eq(companionProfiles.companion_id, companion.id),
  })
  if (!profile) return NextResponse.json({ error: 'Profile not found — complete onboarding first' }, { status: 404 })

  const body = await req.json()
  const { url, storage_key, alt_text } = body

  if (!url || !storage_key) return NextResponse.json({ error: 'url and storage_key required' }, { status: 400 })

  const [{ photoCount }] = await db.select({ photoCount: sql<number>`COUNT(*)::int` })
    .from(companionPhotos)
    .where(and(
      eq(companionPhotos.companion_profile_id, profile.id),
      isNull(companionPhotos.deleted_at),
    ))

  const [inserted] = await db.insert(companionPhotos).values({
    companion_profile_id: profile.id,
    url,
    storage_key,
    alt_text:    alt_text ?? null,
    sort_order:  photoCount,
    is_primary:  photoCount === 0,
    is_approved: false,
  }).returning({ id: companionPhotos.id })

  return NextResponse.json({ id: inserted.id })
}
