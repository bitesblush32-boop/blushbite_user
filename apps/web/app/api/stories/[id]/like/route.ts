import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { likes, stories } from '@/db/schema'
import { and, eq, sql } from 'drizzle-orm'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id: storyId } = await params
    const userId = session.user.id

    await db
      .insert(likes)
      .values({ user_id: userId, content_type: 'story', content_id: storyId })
      .onConflictDoNothing()

    const [updated] = await db
      .update(stories)
      .set({ like_count: sql`${stories.like_count} + 1` })
      .where(eq(stories.id, storyId))
      .returning({ likeCount: stories.like_count })

    return NextResponse.json({ liked: true, likeCount: updated?.likeCount ?? 0 })
  } catch (err) {
    console.error('[POST /api/stories/[id]/like]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id: storyId } = await params
    const userId = session.user.id

    await db
      .delete(likes)
      .where(
        and(
          eq(likes.user_id, userId),
          eq(likes.content_type, 'story'),
          eq(likes.content_id, storyId),
        )
      )

    const [updated] = await db
      .update(stories)
      .set({ like_count: sql`GREATEST(${stories.like_count} - 1, 0)` })
      .where(eq(stories.id, storyId))
      .returning({ likeCount: stories.like_count })

    return NextResponse.json({ liked: false, likeCount: updated?.likeCount ?? 0 })
  } catch (err) {
    console.error('[DELETE /api/stories/[id]/like]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
