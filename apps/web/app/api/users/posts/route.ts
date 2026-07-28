import { NextResponse } from 'next/server'
import { getSession } from '@/lib/dreamerSession'
import { db } from '@/db'
import { stories, storyCategories } from '@/db/schema'
import { eq, and, isNull, desc } from 'drizzle-orm'

const UNAUTH = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export async function GET() {
  const session = await getSession()
  if (!session) return UNAUTH

  const rows = await db
    .select({
      id: stories.id,
      title: stories.title,
      excerpt: stories.excerpt,
      like_count: stories.like_count,
      save_count: stories.save_count,
      view_count: stories.view_count,
      comment_count: stories.comment_count,
      moderation_status: stories.moderation_status,
      created_at: stories.created_at,
      category_name: storyCategories.name,
    })
    .from(stories)
    .leftJoin(storyCategories, eq(storyCategories.id, stories.category_id))
    .where(
      and(
        eq(stories.author_user_id, session.sub),
        eq(stories.author_type, 'user'),
        isNull(stories.deleted_at)
      )
    )
    .orderBy(desc(stories.created_at))
    .limit(100)

  const data = rows.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    firstImage: null,
    pageImageUrls: [] as string[],
    categories: r.category_name ? [r.category_name] : [],
    likeCount: r.like_count,
    saveCount: r.save_count,
    viewCount: r.view_count,
    commentCount: r.comment_count,
    moderationStatus: r.moderation_status,
    createdAt: r.created_at.toISOString(),
  }))

  return NextResponse.json({ data })
}
