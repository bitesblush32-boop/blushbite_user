import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  const { id: notifId } = await params

  await db
    .update(notifications)
    .set({ is_read: true })
    .where(
      and(
        eq(notifications.id, notifId),
        eq(notifications.recipient_id, userId),
      )
    )

  return NextResponse.json({ ok: true })
}
