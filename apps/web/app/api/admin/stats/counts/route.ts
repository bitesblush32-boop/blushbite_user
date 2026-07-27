import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import {
  companions,
  companionProfiles,
  stories,
  audioRecordings,
  bookingRequests,
  companionStoryBridges,
} from '@/db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  let pendingCompanionsRow, pendingStoriesRow, pendingAudioRow, openBookingsRow, pendingBridgesRow
  try {
    ;[
      [pendingCompanionsRow],
      [pendingStoriesRow],
      [pendingAudioRow],
      [openBookingsRow],
      [pendingBridgesRow],
    ] = await Promise.all([
      db
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(companions)
        .innerJoin(companionProfiles, eq(companionProfiles.companion_id, companions.id))
        .where(
          and(
            eq(companionProfiles.is_live, false),
            eq(companionProfiles.is_verified, false),
            isNull(companionProfiles.approved_at)
          )
        ),

      db
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(stories)
        .where(and(eq(stories.moderation_status, 'pending'), isNull(stories.deleted_at))),

      db
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(audioRecordings)
        .where(
          and(eq(audioRecordings.moderation_status, 'pending'), isNull(audioRecordings.deleted_at))
        ),

      db
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(bookingRequests)
        .where(eq(bookingRequests.status, 'pending')),

      db
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(companionStoryBridges)
        .where(eq(companionStoryBridges.status, 'pending')),
    ])
  } catch (err) {
    console.error('[admin/stats/counts] DB error:', err)
    return NextResponse.json({ error: 'database_error' }, { status: 500 })
  }

  return NextResponse.json({
    pending_companions: pendingCompanionsRow?.n ?? 0,
    pending_stories: pendingStoriesRow?.n ?? 0,
    pending_audio: pendingAudioRow?.n ?? 0,
    open_bookings: openBookingsRow?.n ?? 0,
    pending_bridges: pendingBridgesRow?.n ?? 0,
  })
}
