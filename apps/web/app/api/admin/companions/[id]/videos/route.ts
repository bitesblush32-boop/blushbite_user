import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { companionVideos } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { video_id, action } = await req.json()
  if (!video_id || !action) {
    return NextResponse.json({ error: 'video_id and action required' }, { status: 400 })
  }

  if (action === 'approve') {
    await db.update(companionVideos)
      .set({ is_approved: true })
      .where(eq(companionVideos.id, video_id))
  } else if (action === 'reject') {
    await db.update(companionVideos)
      .set({ deleted_at: new Date() })
      .where(eq(companionVideos.id, video_id))
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
