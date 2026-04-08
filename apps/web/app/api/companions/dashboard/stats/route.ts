import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import {
  companions, companionProfiles, companionPhotos, companionVerifications,
  bookingRequests, stories,
} from '@/db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })
  if (!companion) {
    return NextResponse.json({ error: 'Not a companion' }, { status: 403 })
  }

  const profile = await db.query.companionProfiles.findFirst({
    where: eq(companionProfiles.companion_id, companion.id),
  })

  if (!profile) {
    return NextResponse.json({
      display_name:     companion.name ?? '',
      is_live:          false,
      profile_views:    0,
      pending_bookings: 0,
      total_bookings:   0,
      stories_posted:   0,
      photos_uploaded:  0,
      is_verified:      false,
    })
  }

  const [pendingRows, totalRows, storiesRows, photosRows, verification] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)::int` })
      .from(bookingRequests)
      .where(and(
        eq(bookingRequests.companion_profile_id, profile.id),
        eq(bookingRequests.status, 'pending'),
      )),

    db.select({ count: sql<number>`COUNT(*)::int` })
      .from(bookingRequests)
      .where(eq(bookingRequests.companion_profile_id, profile.id)),

    db.select({ count: sql<number>`COUNT(*)::int` })
      .from(stories)
      .where(and(
        eq(stories.author_companion_id, companion.id),
        eq(stories.is_published, true),
      )),

    db.select({ count: sql<number>`COUNT(*)::int` })
      .from(companionPhotos)
      .where(and(
        eq(companionPhotos.companion_profile_id, profile.id),
        isNull(companionPhotos.deleted_at),
      )),

    db.query.companionVerifications.findFirst({
      where: eq(companionVerifications.companion_id, companion.id),
    }),
  ])

  return NextResponse.json({
    display_name:     companion.name ?? '',
    is_live:          profile.is_live,
    profile_views:    0,
    pending_bookings: pendingRows[0]?.count ?? 0,
    total_bookings:   totalRows[0]?.count   ?? 0,
    stories_posted:   storiesRows[0]?.count ?? 0,
    photos_uploaded:  photosRows[0]?.count  ?? 0,
    is_verified:      verification?.provider_status === 'approved',
  })
}
