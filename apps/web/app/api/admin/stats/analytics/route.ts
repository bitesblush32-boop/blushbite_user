import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import {
  stories, bookingRequests, fantasyTags, fantasyCategories,
  companionFantasyTags, storyFantasyTags,
} from '@/db/schema'
import { eq, sql, asc, desc, isNull } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const [contentByAuthor, bookingFunnel, topFantasyTags] = await Promise.all([

    // Content breakdown by author_type
    db
      .select({
        author_type: stories.author_type,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(stories)
      .where(isNull(stories.deleted_at))
      .groupBy(stories.author_type),

    // Booking funnel by status
    db
      .select({
        status: bookingRequests.status,
        count:  sql<number>`COUNT(*)::int`,
      })
      .from(bookingRequests)
      .groupBy(bookingRequests.status),

    // Top 10 fantasy tags by combined usage (companions + stories)
    db
      .select({
        id:            fantasyTags.id,
        name:          fantasyTags.name,
        category_name: fantasyCategories.name,
        usage_count:   sql<number>`(
          SELECT COUNT(*)::int FROM companion_fantasy_tags WHERE fantasy_tag_id = ${fantasyTags.id}
        ) + (
          SELECT COUNT(*)::int FROM story_fantasy_tags WHERE fantasy_tag_id = ${fantasyTags.id}
        )`,
      })
      .from(fantasyTags)
      .leftJoin(fantasyCategories, eq(fantasyCategories.id, fantasyTags.category_id))
      .where(eq(fantasyTags.is_active, true))
      .orderBy(
        desc(
          sql`(SELECT COUNT(*) FROM companion_fantasy_tags WHERE fantasy_tag_id = ${fantasyTags.id}) +
              (SELECT COUNT(*) FROM story_fantasy_tags WHERE fantasy_tag_id = ${fantasyTags.id})`
        )
      )
      .limit(10),

  ])

  // Normalise content_by_author into a map
  const contentMap: Record<string, number> = {}
  for (const row of contentByAuthor) {
    contentMap[row.author_type] = row.count
  }

  // Normalise booking_funnel into a map
  const funnelMap: Record<string, number> = {}
  for (const row of bookingFunnel) {
    funnelMap[row.status] = row.count
  }
  const totalBookings = Object.values(funnelMap).reduce((s, n) => s + n, 0)

  return NextResponse.json({
    data: {
      content_by_author: {
        admin:     contentMap['admin']     ?? 0,
        companion: contentMap['companion'] ?? 0,
        user:      contentMap['user']      ?? 0,
      },
      booking_funnel: {
        pending:   funnelMap['pending']   ?? 0,
        accepted:  funnelMap['accepted']  ?? 0,
        completed: funnelMap['completed'] ?? 0,
        declined:  funnelMap['declined']  ?? 0,
        cancelled: funnelMap['cancelled'] ?? 0,
        total:     totalBookings,
      },
      top_fantasy_tags: topFantasyTags,
    },
  })
}
