import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { likes, comments } from '@/db/schema'
import { and, eq, sql } from 'drizzle-orm'

type Params = { params: Promise<{ id: string; commentId: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id
    const { commentId } = await params

    await db
      .insert(likes)
      .values({ user_id: userId, content_type: 'comment', content_id: commentId })
      .onConflictDoNothing()

    const [updated] = await db
      .update(comments)
      .set({ like_count: sql`${comments.like_count} + 1` })
      .where(eq(comments.id, commentId))
      .returning({ likeCount: comments.like_count })

    return NextResponse.json({ liked: true, likeCount: updated?.likeCount ?? 0 })
  } catch (err) {
    console.error('[POST /api/stories/[id]/comments/[commentId]/like]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id
    const { commentId } = await params

    await db
      .delete(likes)
      .where(
        and(
          eq(likes.user_id, userId),
          eq(likes.content_type, 'comment'),
          eq(likes.content_id, commentId),
        )
      )

    const [updated] = await db
      .update(comments)
      .set({ like_count: sql`GREATEST(${comments.like_count} - 1, 0)` })
      .where(eq(comments.id, commentId))
      .returning({ likeCount: comments.like_count })

    return NextResponse.json({ liked: false, likeCount: updated?.likeCount ?? 0 })
  } catch (err) {
    console.error('[DELETE /api/stories/[id]/comments/[commentId]/like]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
