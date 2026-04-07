import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companionVideos } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const user = session?.user as any
  if (!session || user?.platform_role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
