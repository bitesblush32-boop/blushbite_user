export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import {
  stories,
  storyCategories,
  companions,
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

    // Public ranking: engagement + recency only
    const engagementScore = sql<number>`LEAST(
      (3.0 * LN(1.0 + ${stories.save_count}::float)
     + 2.0 * LN(1.0 + ${stories.comment_count}::float)
     + 1.0 * LN(1.0 + ${stories.like_count}::float)
     + 0.1 * LN(1.0 + ${stories.view_count}::float)) / 25.0,
      1.0)`

    const recencyScore = sql<number>`EXP(
      -0.231 * EXTRACT(EPOCH FROM (NOW() - ${stories.published_at})) / 86400.0
    )`

    const finalScore = sql<number>`(0.60 * (${engagementScore}) + 0.40 * (${recencyScore}))`

    const baseWhere = and(
      inArray(stories.author_type, ['companion', 'admin']),
      eq(stories.is_published, true),
      isNull(stories.deleted_at),
      eq(stories.moderation_status, 'approved'),
    )

    const cursorWhere = cursor
      ? or(
          sql`(0.60 * (${engagementScore}) + 0.40 * (${recencyScore})) < ${cursor.score}::float`,
          and(
            sql`(0.60 * (${engagementScore}) + 0.40 * (${recencyScore})) = ${cursor.score}::float`,
            sql`${stories.id}::text < ${cursor.id}`,
          ),
        )
      : undefined

    const whereClause = cursorWhere ? and(baseWhere, cursorWhere) : baseWhere

    const rows = await db
      .select({
        id:              stories.id,
        title:           stories.title,
        is_anonymous:    stories.is_anonymous,
        body:            stories.body,
        excerpt:         stories.excerpt,
        like_count:      stories.like_count,
        save_count:      stories.save_count,
        view_count:      stories.view_count,
        comment_count:   stories.comment_count,
        published_at:    stories.published_at,
        final_score:     finalScore,
        companion_alias: companions.alias,
        category_name:   storyCategories.name,
        mood_tags: sql<string | null>`(
          SELECT STRING_AGG(mt.name, ',' ORDER BY mt.name)
          FROM story_mood_tags smt2
          JOIN mood_tags mt ON mt.id = smt2.mood_tag_id
          WHERE smt2.story_id = ${stories.id}
        )`,
      })
      .from(stories)
      .leftJoin(companions, eq(companions.id, stories.author_companion_id))
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
        userHasLiked:   false,
        userHasSaved:   false,
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
