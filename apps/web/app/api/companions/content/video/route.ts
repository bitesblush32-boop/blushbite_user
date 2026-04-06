import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionProfiles, companionVideos } from '@/db/schema'
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
  const { url, storage_key, duration_seconds, thumbnail_url } = body

  if (!url || !storage_key) return NextResponse.json({ error: 'url and storage_key required' }, { status: 400 })
  if (duration_seconds && duration_seconds > 15) {
    return NextResponse.json({ error: 'Videos must be 15 seconds or less' }, { status: 400 })
  }

  const [{ videoCount }] = await db.select({ videoCount: sql<number>`COUNT(*)::int` })
    .from(companionVideos)
    .where(and(
      eq(companionVideos.companion_profile_id, profile.id),
      isNull(companionVideos.deleted_at),
    ))

  if (videoCount >= 3) return NextResponse.json({ error: 'Maximum 3 videos allowed' }, { status: 400 })

  const [inserted] = await db.insert(companionVideos).values({
    companion_profile_id: profile.id,
    url,
    storage_key,
    duration_seconds: duration_seconds ?? null,
    thumbnail_url:    thumbnail_url ?? null,
    is_approved:      false,
  }).returning({ id: companionVideos.id })

  return NextResponse.json({ id: inserted.id })
}
