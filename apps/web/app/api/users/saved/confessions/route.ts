import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { saves, stories } from '@/db/schema'
import { eq, and, isNull, desc, lt } from 'drizzle-orm'

const PAGE_SIZE = 18

// ─── GET /api/users/saved/confessions ────────────────────────────────────────
// Returns paginated confessions the authed user has bookmarked.
// Query param: cursor = last savedAt ISO string for cursor pagination.

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const cursorParam = searchParams.get('cursor')
    const cursor = cursorParam ? new Date(cursorParam) : null

    // No moderation_status filter — the saver owns their bookmark list
    // regardless of whether the story is pending/approved/rejected.
    // Only exclude hard-deleted stories.
    const conditions = [
      eq(saves.user_id, session.user.id),
      eq(saves.content_type, 'story'),
      isNull(stories.deleted_at),
      ...(cursor ? [lt(saves.created_at, cursor)] : []),
    ]

    const rows = await db
      .select({
        savedAt:           saves.created_at,
        id:                stories.id,
        title:             stories.title,
        body:              stories.body,
        excerpt:           stories.excerpt,
        author_type:       stories.author_type,
        like_count:        stories.like_count,
        save_count:        stories.save_count,
      })
      .from(saves)
      .innerJoin(stories, eq(saves.content_id, stories.id))
      .where(and(...conditions))
      .orderBy(desc(saves.created_at))
      .limit(PAGE_SIZE + 1)

    const hasMore = rows.length > PAGE_SIZE
    const items   = (hasMore ? rows.slice(0, PAGE_SIZE) : rows).map(r => {
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
        savedAt:    (r.savedAt as Date).toISOString(),
      }
    })

    const nextCursor = hasMore
      ? (rows[PAGE_SIZE - 1].savedAt as Date).toISOString()
      : null

    return NextResponse.json({ data: items, nextCursor })
  } catch (err) {
    console.error('[GET /api/users/saved/confessions]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 })
  }
}
