import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { stories } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

// ─── DELETE /api/users/posts/[id] ────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId  = session.user.id
    const storyId = params.id

    // Verify ownership
    const owned = await db
      .select({ id: stories.id })
      .from(stories)
      .where(
        and(
          eq(stories.id, storyId),
          eq(stories.author_user_id, userId),
          isNull(stories.deleted_at),
        )
      )
      .limit(1)

    if (!owned.length) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
    }

    // Soft delete
    await db
      .update(stories)
      .set({ deleted_at: sql`NOW()`, updated_at: sql`NOW()` })
      .where(
        and(
          eq(stories.id, storyId),
          eq(stories.author_user_id, userId),
        )
      )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/users/posts/[id]]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 })
  }
}
