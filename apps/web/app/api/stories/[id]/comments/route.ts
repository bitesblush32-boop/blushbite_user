import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { comments, stories, users } from '@/db/schema'
import { and, eq, isNull, sql, desc, asc } from 'drizzle-orm'
import { z } from 'zod'

// ─── GET /api/stories/[id]/comments ──────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id: storyId } = await params
    const userId = session.user.id

    // Top-level comments
    const topLevel = await db
      .select({
        id:             comments.id,
        body:           comments.body,
        is_anonymous:   comments.is_anonymous,
        like_count:     comments.like_count,
        created_at:     comments.created_at,
        user_id:        comments.user_id,
        parent_id:      comments.parent_id,
        author_alias:   users.alias,
        user_has_liked: sql<boolean>`EXISTS (
          SELECT 1 FROM likes lk
          WHERE lk.user_id = ${userId}::uuid
            AND lk.content_type = 'comment'
            AND lk.content_id = ${comments.id}
        )`,
      })
      .from(comments)
      .leftJoin(users, eq(users.id, comments.user_id))
      .where(
        and(
          eq(comments.content_type, 'story'),
          eq(comments.content_id, storyId),
          isNull(comments.parent_id),
          isNull(comments.deleted_at),
          eq(comments.moderation_status, 'approved'),
        )
      )
      .orderBy(desc(comments.created_at))
      .limit(50)

    // Replies for each top-level comment
    const topLevelIds = topLevel.map(c => c.id)
    const repliesMap: Record<string, typeof topLevel> = {}

    if (topLevelIds.length > 0) {
      const replies = await db
        .select({
          id:             comments.id,
          body:           comments.body,
          is_anonymous:   comments.is_anonymous,
          like_count:     comments.like_count,
          created_at:     comments.created_at,
          user_id:        comments.user_id,
          parent_id:      comments.parent_id,
          author_alias:   users.alias,
          user_has_liked: sql<boolean>`EXISTS (
            SELECT 1 FROM likes lk
            WHERE lk.user_id = ${userId}::uuid
              AND lk.content_type = 'comment'
              AND lk.content_id = ${comments.id}
          )`,
        })
        .from(comments)
        .leftJoin(users, eq(users.id, comments.user_id))
        .where(
          and(
            eq(comments.content_type, 'story'),
            eq(comments.content_id, storyId),
            sql`${comments.parent_id} = ANY(ARRAY[${sql.join(topLevelIds.map(id => sql`${id}::uuid`), sql`, `)}])`,
            isNull(comments.deleted_at),
            eq(comments.moderation_status, 'approved'),
          )
        )
        .orderBy(asc(comments.created_at))

      for (const r of replies) {
        if (!r.parent_id) continue
        if (!repliesMap[r.parent_id]) repliesMap[r.parent_id] = []
        repliesMap[r.parent_id].push(r)
      }
    }

    const result = topLevel.map(c => ({
      ...c,
      replies: repliesMap[c.id] ?? [],
    }))

    return NextResponse.json({ comments: result })
  } catch (err) {
    console.error('[GET /api/stories/[id]/comments]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ─── POST /api/stories/[id]/comments ─────────────────────────────────────────

const postSchema = z.object({
  body:     z.string().min(1).max(500),
  parentId: z.string().uuid().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id: storyId } = await params
    const userId = session.user.id

    let raw: unknown
    try { raw = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const result = postSchema.safeParse(raw)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message ?? 'Invalid input' }, { status: 400 })
    }
    const { body, parentId } = result.data

    // Verify parentId belongs to this story
    if (parentId) {
      const parent = await db
        .select({ id: comments.id })
        .from(comments)
        .where(and(eq(comments.id, parentId), eq(comments.content_id, storyId)))
        .limit(1)
      if (!parent.length) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
    }

    const [newComment] = await db
      .insert(comments)
      .values({
        user_id:           userId,
        content_type:      'story',
        content_id:        storyId,
        parent_id:         parentId ?? null,
        body,
        is_anonymous:      false,
        moderation_status: 'approved',
      })
      .returning()

    await db
      .update(stories)
      .set({ comment_count: sql`${stories.comment_count} + 1` })
      .where(eq(stories.id, storyId))

    const [userRow] = await db
      .select({ alias: users.alias })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    return NextResponse.json({
      comment: {
        ...newComment,
        author_alias:   userRow?.alias ?? null,
        user_has_liked: false,
        replies:        [],
      },
    })
  } catch (err) {
    console.error('[POST /api/stories/[id]/comments]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
