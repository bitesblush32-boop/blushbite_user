import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { stories, users, companions, storyCategories } from '@/db/schema'
import { eq, and, isNull, ilike, or, sql, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'all'
  const search = searchParams.get('search') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'))
  const offset = (page - 1) * limit

  const conditions: ReturnType<typeof isNull>[] = [isNull(stories.deleted_at)]

  if (filter === 'pending' || filter === 'approved' || filter === 'rejected') {
    conditions.push(eq(stories.moderation_status, filter) as any)
  } else if (filter === 'user' || filter === 'companion' || filter === 'admin') {
    conditions.push(eq(stories.author_type, filter) as any)
  } else if (filter === 'featured') {
    conditions.push(eq(stories.is_featured, true) as any)
  }

  if (search) {
    conditions.push(
      or(ilike(stories.title, `%${search}%`), ilike(stories.excerpt, `%${search}%`)) as any
    )
  }

  const where = and(...conditions)

  const [rows, countRows, pendingRows] = await Promise.all([
    db
      .select({
        id: stories.id,
        title: stories.title,
        excerpt: stories.excerpt,
        author_type: stories.author_type,
        is_anonymous: stories.is_anonymous,
        is_published: stories.is_published,
        is_featured: stories.is_featured,
        moderation_status: stories.moderation_status,
        moderated_at: stories.moderated_at,
        view_count: stories.view_count,
        like_count: stories.like_count,
        save_count: stories.save_count,
        comment_count: stories.comment_count,
        created_at: stories.created_at,
        published_at: stories.published_at,
        user_alias: users.alias,
        companion_name: companions.name,
        category_name: storyCategories.name,
      })
      .from(stories)
      .leftJoin(users, eq(users.id, stories.author_user_id))
      .leftJoin(companions, eq(companions.id, stories.author_companion_id))
      .leftJoin(storyCategories, eq(storyCategories.id, stories.category_id))
      .where(where)
      .orderBy(desc(stories.created_at))
      .limit(limit)
      .offset(offset),

    db
      .select({ n: sql<number>`count(*)::int` })
      .from(stories)
      .leftJoin(users, eq(users.id, stories.author_user_id))
      .leftJoin(companions, eq(companions.id, stories.author_companion_id))
      .where(where),

    db
      .select({ n: sql<number>`count(*)::int` })
      .from(stories)
      .where(and(isNull(stories.deleted_at), eq(stories.moderation_status, 'pending'))),
  ])

  return NextResponse.json({
    data: rows,
    meta: {
      total: Number(countRows[0]?.n ?? 0),
      pending_count: Number(pendingRows[0]?.n ?? 0),
      page,
      limit,
    },
  })
}
