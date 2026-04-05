import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { comments, stories } from '@/db/schema'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'

type Params = { params: Promise<{ id: string; commentId: string }> }

// ─── PATCH /api/stories/[id]/comments/[commentId] ────────────────────────────

const patchSchema = z.object({
  body: z.string().min(1).max(500),
})

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id
    const { commentId } = await params

    let raw: unknown
    try { raw = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const result = patchSchema.safeParse(raw)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message ?? 'Invalid input' }, { status: 400 })
    }

    const [updated] = await db
      .update(comments)
      .set({ body: result.data.body, updated_at: new Date() })
      .where(
        and(
          eq(comments.id, commentId),
          eq(comments.user_id, userId),
          isNull(comments.deleted_at),
        )
      )
      .returning()

    if (!updated) return NextResponse.json({ error: 'Comment not found or not yours' }, { status: 404 })
    return NextResponse.json({ comment: updated })
  } catch (err) {
    console.error('[PATCH /api/stories/[id]/comments/[commentId]]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ─── DELETE /api/stories/[id]/comments/[commentId] ───────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id
    const { id: storyId, commentId } = await params

    const [deleted] = await db
      .update(comments)
      .set({ deleted_at: new Date() })
      .where(
        and(
          eq(comments.id, commentId),
          eq(comments.user_id, userId),
          isNull(comments.deleted_at),
        )
      )
      .returning({ id: comments.id })

    if (!deleted) return NextResponse.json({ error: 'Comment not found or not yours' }, { status: 404 })

    await db
      .update(stories)
      .set({ comment_count: sql`GREATEST(${stories.comment_count} - 1, 0)` })
      .where(eq(stories.id, storyId))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/stories/[id]/comments/[commentId]]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
