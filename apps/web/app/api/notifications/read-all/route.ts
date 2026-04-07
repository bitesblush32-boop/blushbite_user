import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

export async function PATCH() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  await db
    .update(notifications)
    .set({ is_read: true })
    .where(
      and(
        eq(notifications.recipient_id, userId),
        eq(notifications.is_read, false),
      )
    )

  return NextResponse.json({ ok: true })
}
