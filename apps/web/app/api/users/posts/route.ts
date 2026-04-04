import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { stories } from '@/db/schema'
import { eq, and, isNull, desc } from 'drizzle-orm'

// ─── GET /api/users/posts ─────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const rows = await db
      .select({
        id:                stories.id,
        title:             stories.title,
        body:              stories.body,
        excerpt:           stories.excerpt,
        like_count:        stories.like_count,
        save_count:        stories.save_count,
        view_count:        stories.view_count,
        comment_count:     stories.comment_count,
        moderation_status: stories.moderation_status,
        is_published:      stories.is_published,
        created_at:        stories.created_at,
      })
      .from(stories)
      .where(
        and(
          eq(stories.author_user_id, userId),
          isNull(stories.deleted_at),
        )
      )
      .orderBy(desc(stories.created_at))
      .limit(50)

    const data = rows.map(s => {
      const parsed = (() => { try { return JSON.parse(s.body) } catch { return {} } })()
      const pageImageUrls: string[] = parsed.pages ?? []
      const categories: string[]    = parsed.categories ?? []
      const firstImage = pageImageUrls[0] ?? null

      return {
        id:                s.id,
        title:             s.title || null,
        excerpt:           s.excerpt ?? null,
        firstImage,
        pageImageUrls,
        categories,
        likeCount:         s.like_count,
        saveCount:         s.save_count,
        viewCount:         s.view_count,
        commentCount:      s.comment_count,
        moderationStatus:  s.moderation_status,
        createdAt:         s.created_at,
      }
    })

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/users/posts]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 })
  }
}
