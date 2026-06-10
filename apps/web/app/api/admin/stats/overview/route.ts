import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import {
  users,
  companions,
  companionProfiles,
  stories,
  audioRecordings,
  bookingRequests,
  likes,
  saves,
  comments,
} from '@/db/schema'
import { eq, gte, isNull, and, sql } from 'drizzle-orm'

const cnt = (rows: { n: unknown }[]) => Number(rows[0]?.n ?? 0)
const q   = (table: Parameters<typeof db.select>[0] extends undefined ? never : any) =>
  db.select({ n: sql`count(*)` })

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const [
    rDreamers,
    rCompanionsLive,
    rCompanionsPending,
    rCompanionsAll,
    rStoriesPending,
    rStoriesApproved,
    rStoriesTotal,
    rAudioPending,
    rBookingsOpen,
    rBookingsTotal,
    rBookingsCompleted,
    rNewDreamers,
    rNewCompanions,
    rNewStories,
    rLikes,
    rSaves,
    rComments,
  ] = await Promise.all([
    // Platform totals
    db.select({ n: sql`count(*)` }).from(users),
    db.select({ n: sql`count(*)` }).from(companionProfiles).where(eq(companionProfiles.is_live, true)),
    db.select({ n: sql`count(*)` }).from(companions).where(eq(companions.companion_stage, 3)),
    db.select({ n: sql`count(*)` }).from(companions),

    // Content counts
    db.select({ n: sql`count(*)` }).from(stories).where(
      and(eq(stories.moderation_status, 'pending'), isNull(stories.deleted_at))
    ),
    db.select({ n: sql`count(*)` }).from(stories).where(
      and(eq(stories.moderation_status, 'approved'), eq(stories.is_published, true), isNull(stories.deleted_at))
    ),
    db.select({ n: sql`count(*)` }).from(stories).where(isNull(stories.deleted_at)),
    db.select({ n: sql`count(*)` }).from(audioRecordings).where(
      and(eq(audioRecordings.moderation_status, 'pending'), isNull(audioRecordings.deleted_at))
    ),

    // Bookings
    db.select({ n: sql`count(*)` }).from(bookingRequests).where(eq(bookingRequests.status, 'pending')),
    db.select({ n: sql`count(*)` }).from(bookingRequests),
    db.select({ n: sql`count(*)` }).from(bookingRequests).where(eq(bookingRequests.status, 'completed')),

    // New today
    db.select({ n: sql`count(*)` }).from(users).where(gte(users.created_at, todayStart)),
    db.select({ n: sql`count(*)` }).from(companions).where(gte(companions.created_at, todayStart)),
    db.select({ n: sql`count(*)` }).from(stories).where(
      and(gte(stories.created_at, todayStart), isNull(stories.deleted_at))
    ),

    // Engagement totals
    db.select({ n: sql`count(*)` }).from(likes),
    db.select({ n: sql`count(*)` }).from(saves),
    db.select({ n: sql`count(*)` }).from(comments).where(isNull(comments.deleted_at)),
  ])

  return NextResponse.json({
    data: {
      total_dreamers:           cnt(rDreamers),
      total_companions_live:    cnt(rCompanionsLive),
      total_companions_pending: cnt(rCompanionsPending),
      total_companions_all:     cnt(rCompanionsAll),

      stories_pending:  cnt(rStoriesPending),
      stories_approved: cnt(rStoriesApproved),
      stories_total:    cnt(rStoriesTotal),
      audio_pending:    cnt(rAudioPending),

      bookings_open:      cnt(rBookingsOpen),
      bookings_total:     cnt(rBookingsTotal),
      bookings_completed: cnt(rBookingsCompleted),

      new_dreamers_today:   cnt(rNewDreamers),
      new_companions_today: cnt(rNewCompanions),
      new_stories_today:    cnt(rNewStories),

      total_likes:    cnt(rLikes),
      total_saves:    cnt(rSaves),
      total_comments: cnt(rComments),
    },
  })
}
