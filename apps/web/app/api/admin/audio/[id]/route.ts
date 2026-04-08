import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { audioRecordings } from '@/db/schema'
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

  const { action } = await req.json()
  if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 })

  const now = new Date()

  if (action === 'approve') {
    await db.update(audioRecordings)
      .set({ moderation_status: 'approved' })
      .where(eq(audioRecordings.id, params.id))
  } else if (action === 'reject') {
    await db.update(audioRecordings)
      .set({ moderation_status: 'rejected' })
      .where(eq(audioRecordings.id, params.id))
  } else if (action === 'delete') {
    await db.update(audioRecordings)
      .set({ deleted_at: now })
      .where(eq(audioRecordings.id, params.id))
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
