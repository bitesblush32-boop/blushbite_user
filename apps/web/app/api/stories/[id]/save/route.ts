import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { saves, stories } from '@/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { createNotification } from '@/db/helpers/createNotification'

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
      .insert(saves)
      .values({ user_id: userId, content_type: 'story', content_id: storyId })
      .onConflictDoNothing()

    const [updated] = await db
      .update(stories)
      .set({ save_count: sql`${stories.save_count} + 1` })
      .where(eq(stories.id, storyId))
      .returning({ saveCount: stories.save_count, authorId: stories.author_user_id })

    try {
      if (updated?.authorId) {
        await createNotification({
          recipientId: updated.authorId,
          actorId:     userId,
          type:        'story_save',
          contentType: 'story',
          contentId:   storyId,
        })
      }
    } catch { /* notification failure must never break the save response */ }

    return NextResponse.json({ saved: true, saveCount: updated?.saveCount ?? 0 })
  } catch (err) {
    console.error('[POST /api/stories/[id]/save]', err)
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
      .delete(saves)
      .where(
        and(
          eq(saves.user_id, userId),
          eq(saves.content_type, 'story'),
          eq(saves.content_id, storyId),
        )
      )

    const [updated] = await db
      .update(stories)
      .set({ save_count: sql`GREATEST(${stories.save_count} - 1, 0)` })
      .where(eq(stories.id, storyId))
      .returning({ saveCount: stories.save_count })

    return NextResponse.json({ saved: false, saveCount: updated?.saveCount ?? 0 })
  } catch (err) {
    console.error('[DELETE /api/stories/[id]/save]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
