import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { likes, stories } from '@/db/schema'
import { eq, and, isNull, desc, lt, inArray } from 'drizzle-orm'

const PAGE_SIZE = 18

type ContentType = 'all' | 'confessions' | 'stories'

// ─── GET /api/users/liked ─────────────────────────────────────────────────────
// Returns paginated stories the authed user has liked.
// Query params:
//   type   = 'all' | 'confessions' | 'stories'  (default 'all')
//   cursor = ISO datetime of last likes.created_at

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type   = (searchParams.get('type') ?? 'all') as ContentType
    const cursorParam = searchParams.get('cursor')
    const cursor = cursorParam ? new Date(cursorParam) : null

    const conditions = [
      eq(likes.user_id, session.user.id),
      eq(likes.content_type, 'story'),
      isNull(stories.deleted_at),
      eq(stories.moderation_status, 'approved'),
      ...(type === 'confessions'
        ? [eq(stories.author_type, 'user')]
        : type === 'stories'
        ? [inArray(stories.author_type, ['companion', 'admin'])]
        : []),
      ...(cursor ? [lt(likes.created_at, cursor)] : []),
    ]

    const rows = await db
      .select({
        likedAt:    likes.created_at,
        id:         stories.id,
        title:      stories.title,
        body:       stories.body,
        excerpt:    stories.excerpt,
        author_type: stories.author_type,
        like_count:  stories.like_count,
        save_count:  stories.save_count,
      })
      .from(likes)
      .innerJoin(stories, eq(likes.content_id, stories.id))
      .where(and(...conditions))
      .orderBy(desc(likes.created_at))
      .limit(PAGE_SIZE + 1)

    const hasMore = rows.length > PAGE_SIZE
    const items = (hasMore ? rows.slice(0, PAGE_SIZE) : rows).map(r => {
      const parsed     = (() => { try { return JSON.parse(r.body) } catch { return {} } })()
      const pageImages: string[] = parsed.pages ?? []
      const categories: string[] = parsed.categories ?? []
      const firstImage = pageImages[0] ?? null

      return {
        id:         r.id,
        title:      r.title || null,
        excerpt:    r.excerpt ?? null,
        firstImage,
        categories,
        authorType: r.author_type,
        likeCount:  r.like_count,
        saveCount:  r.save_count,
        likedAt:    (r.likedAt as Date).toISOString(),
      }
    })

    const nextCursor = hasMore
      ? (rows[PAGE_SIZE - 1].likedAt as Date).toISOString()
      : null

    return NextResponse.json({ data: items, nextCursor })
  } catch (err) {
    console.error('[GET /api/users/liked]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 })
  }
}
