import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import {
  stories,
  storyCategories,
  users,
  companions,
  userFantasyTags,
} from '@/db/schema'
import { eq, and, isNull, sql, or, desc, inArray } from 'drizzle-orm'
import { z } from 'zod'

const querySchema = z.object({
  limit:  z.coerce.number().int().min(1).max(20).default(5),
  cursor: z.string().optional(),
})

interface Cursor { score: number; id: string }

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse({
      limit:  searchParams.get('limit') ?? undefined,
      cursor: searchParams.get('cursor') ?? undefined,
    })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query params' }, { status: 400 })
    }
    const { limit } = parsed.data
    let cursor: Cursor | null = null
    if (parsed.data.cursor) {
      try { cursor = JSON.parse(parsed.data.cursor) } catch { /* ignore */ }
    }

    // Count user's fantasy tags for normalization
    const userTagCountRows = await db
      .select({ cnt: sql<number>`COUNT(*)::int` })
      .from(userFantasyTags)
      .where(eq(userFantasyTags.user_id, userId))
    const userTagCount = userTagCountRows[0]?.cnt ?? 0

    // Ranking score expressions
    const tagMatchScore = userTagCount > 0
      ? sql<number>`(
          SELECT COUNT(*)::float
          FROM story_fantasy_tags sft2
          WHERE sft2.story_id = ${stories.id}
            AND sft2.fantasy_tag_id IN (
              SELECT fantasy_tag_id FROM user_fantasy_tags WHERE user_id = ${userId}::uuid
            )
        ) / GREATEST(${userTagCount}::float, 1.0)`
      : sql<number>`0.0`

    const engagementScore = sql<number>`LEAST(
      (3.0 * LN(1.0 + ${stories.save_count}::float)
     + 2.0 * LN(1.0 + ${stories.comment_count}::float)
     + 1.0 * LN(1.0 + ${stories.like_count}::float)
     + 0.1 * LN(1.0 + ${stories.view_count}::float)) / 25.0,
      1.0)`

    const recencyScore = sql<number>`EXP(
      -0.231 * EXTRACT(EPOCH FROM (NOW() - ${stories.published_at})) / 86400.0
    )`

    const finalScore = sql<number>`(
      0.40 * (${tagMatchScore})
    + 0.35 * (${engagementScore})
    + 0.25 * (${recencyScore})
    )`

    const baseWhere = and(
      inArray(stories.author_type, ['companion', 'admin']),
      eq(stories.is_published, true),
      isNull(stories.deleted_at),
      eq(stories.moderation_status, 'approved'),
    )

    const cursorWhere = cursor
      ? or(
          sql`(
            0.40 * (${tagMatchScore})
          + 0.35 * (${engagementScore})
          + 0.25 * (${recencyScore})
          ) < ${cursor.score}::float`,
          and(
            sql`(
              0.40 * (${tagMatchScore})
            + 0.35 * (${engagementScore})
            + 0.25 * (${recencyScore})
            ) = ${cursor.score}::float`,
            sql`${stories.id}::text < ${cursor.id}`,
          ),
        )
      : undefined

    const whereClause = cursorWhere ? and(baseWhere, cursorWhere) : baseWhere

    const rows = await db
      .select({
        id:               stories.id,
        title:            stories.title,
        is_anonymous:     stories.is_anonymous,
        body:             stories.body,
        excerpt:          stories.excerpt,
        like_count:       stories.like_count,
        save_count:       stories.save_count,
        view_count:       stories.view_count,
        comment_count:    stories.comment_count,
        published_at:     stories.published_at,
        final_score:      finalScore,
        // Companion alias (for companion-authored stories)
        companion_alias:  companions.alias,
        category_name:    storyCategories.name,
        user_has_liked: sql<boolean>`EXISTS (
          SELECT 1 FROM likes lk
          WHERE lk.user_id = ${userId}::uuid
            AND lk.content_type = 'story'
            AND lk.content_id = ${stories.id}
        )`,
        user_has_saved: sql<boolean>`EXISTS (
          SELECT 1 FROM saves sv
          WHERE sv.user_id = ${userId}::uuid
            AND sv.content_type = 'story'
            AND sv.content_id = ${stories.id}
        )`,
        mood_tags: sql<string | null>`(
          SELECT STRING_AGG(mt.name, ',' ORDER BY mt.name)
          FROM story_mood_tags smt2
          JOIN mood_tags mt ON mt.id = smt2.mood_tag_id
          WHERE smt2.story_id = ${stories.id}
        )`,
      })
      .from(stories)
      // Companion alias: join on author_companion_id (null for admin-authored)
      .leftJoin(companions, eq(companions.id, stories.author_companion_id))
      // storyCategories join for fallback category name
      .leftJoin(storyCategories, eq(storyCategories.id, stories.category_id))
      .where(whereClause)
      .orderBy(desc(finalScore), desc(stories.id))
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const items = rows.slice(0, limit)
    const last = items[items.length - 1]
    const nextCursor: Cursor | null = hasMore && last
      ? { score: Number(last.final_score), id: last.id }
      : null

    const mapped = items.map(r => {
      const parsedBody = (() => {
        try { return JSON.parse(r.body ?? '') } catch { return { raw: r.body ?? '', pages: [], categories: [] } }
      })()
      const bodyCategories: string[] = Array.isArray(parsedBody.categories) ? parsedBody.categories : []
      const primaryCategory = bodyCategories[0] ?? r.category_name ?? ''
      const extraCategories = bodyCategories.slice(1)
      const dbMoodTags = r.mood_tags ? r.mood_tags.split(',') : []
      return {
        id:             r.id,
        title:          r.title ?? '',
        authorAlias:    r.is_anonymous ? null : (r.companion_alias ?? null),
        isAnonymous:    r.is_anonymous,
        body:           r.body,
        rawBody:        (parsedBody.raw as string) ?? (r.body ?? ''),
        pageImageUrls:  (parsedBody.pages as string[]) ?? [],
        excerpt:        r.excerpt ?? '',
        likeCount:      r.like_count,
        saveCount:      r.save_count,
        viewCount:      r.view_count,
        commentCount:   r.comment_count,
        userHasLiked:   Boolean(r.user_has_liked),
        userHasSaved:   Boolean(r.user_has_saved),
        moodTags:       extraCategories.length > 0 ? extraCategories : dbMoodTags,
        categoryName:   primaryCategory,
        publishedAt:    r.published_at,
        relevanceScore: Number(r.final_score),
      }
    })

    return NextResponse.json({ items: mapped, nextCursor })
  } catch (err) {
    console.error('[GET /api/platform-stories]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 })
  }
}
