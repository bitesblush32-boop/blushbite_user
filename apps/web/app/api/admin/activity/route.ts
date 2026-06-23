import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import {
  users,
  companions,
  companionProfiles,
  stories,
  bookingRequests,
} from '@/db/schema'
import { eq, desc, isNotNull, isNull, and, or } from 'drizzle-orm'

interface ActivityEvent {
  type:             string
  timestamp:        string
  id?:              string
  alias?:           string
  email?:           string
  companion_id?:    string
  companion_stage?: number
  title?:           string
  author_type?:     string
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const [
    recentUsers,
    recentCompanions,
    approvedProfiles,
    submittedStories,
    approvedStories,
    newBookings,
    completedBookings,
  ] = await Promise.all([
    db.select({ id: users.id, alias: users.alias, created_at: users.created_at })
      .from(users)
      .orderBy(desc(users.created_at))
      .limit(15),

    db.select({ id: companions.id, email: companions.email, companion_stage: companions.companion_stage, created_at: companions.created_at })
      .from(companions)
      .orderBy(desc(companions.created_at))
      .limit(15),

    db.select({ id: companionProfiles.id, companion_id: companionProfiles.companion_id, approved_at: companionProfiles.approved_at })
      .from(companionProfiles)
      .where(and(eq(companionProfiles.is_live, true), isNotNull(companionProfiles.approved_at)))
      .orderBy(desc(companionProfiles.approved_at))
      .limit(10),

    db.select({ id: stories.id, title: stories.title, author_type: stories.author_type, created_at: stories.created_at })
      .from(stories)
      .where(
        and(
          or(eq(stories.author_type, 'user'), eq(stories.author_type, 'companion')),
          isNull(stories.deleted_at),
        )
      )
      .orderBy(desc(stories.created_at))
      .limit(15),

    db.select({ id: stories.id, title: stories.title, moderated_at: stories.moderated_at })
      .from(stories)
      .where(and(eq(stories.moderation_status, 'approved'), isNotNull(stories.moderated_at), isNull(stories.deleted_at)))
      .orderBy(desc(stories.moderated_at))
      .limit(15),

    db.select({ id: bookingRequests.id, created_at: bookingRequests.created_at })
      .from(bookingRequests)
      .orderBy(desc(bookingRequests.created_at))
      .limit(10),

    db.select({ id: bookingRequests.id, updated_at: bookingRequests.updated_at })
      .from(bookingRequests)
      .where(eq(bookingRequests.status, 'completed'))
      .orderBy(desc(bookingRequests.updated_at))
      .limit(10),
  ])

  const events: ActivityEvent[] = [
    ...recentUsers.map(r => ({
      type:      'new_dreamer',
      timestamp: r.created_at.toISOString(),
      id:        r.id,
      alias:     r.alias ?? undefined,
    })),

    ...recentCompanions.map(r => ({
      type:             'new_companion',
      timestamp:        r.created_at.toISOString(),
      id:               r.id,
      email:            r.email,
      companion_id:     r.id,
      companion_stage:  r.companion_stage,
    })),

    ...approvedProfiles.map(r => ({
      type:          'companion_approved',
      timestamp:     r.approved_at!.toISOString(),
      id:            r.id,
      companion_id:  r.companion_id,
    })),

    ...submittedStories.map(r => ({
      type:        'story_submitted',
      timestamp:   r.created_at.toISOString(),
      id:          r.id,
      title:       r.title,
      author_type: r.author_type,
    })),

    ...approvedStories.map(r => ({
      type:      'story_approved',
      timestamp: r.moderated_at!.toISOString(),
      id:        r.id,
      title:     r.title,
    })),

    ...newBookings.map(r => ({
      type:      'booking_request',
      timestamp: r.created_at.toISOString(),
      id:        r.id,
    })),

    ...completedBookings.map(r => ({
      type:      'booking_completed',
      timestamp: r.updated_at.toISOString(),
      id:        r.id,
    })),
  ]

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return NextResponse.json({ data: events.slice(0, 40) })
}
