import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { stories } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { action } = await req.json()
  if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 })

  const now = new Date()

  if (action === 'approve') {
    await db
      .update(stories)
      .set({
        moderation_status: 'approved',
        is_published: true,
        published_at: now,
        moderated_at: now,
      })
      .where(eq(stories.id, params.id))
  } else if (action === 'reject') {
    await db
      .update(stories)
      .set({ moderation_status: 'rejected', is_published: false, moderated_at: now })
      .where(eq(stories.id, params.id))
  } else if (action === 'feature') {
    await db.update(stories).set({ is_featured: true }).where(eq(stories.id, params.id))
  } else if (action === 'unfeature') {
    await db.update(stories).set({ is_featured: false }).where(eq(stories.id, params.id))
  } else if (action === 'delete') {
    await db.update(stories).set({ deleted_at: now }).where(eq(stories.id, params.id))
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
