import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/dreamerSession'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { eq, and, desc, inArray } from 'drizzle-orm'

const UNAUTH = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export async function GET() {
  const session = await getSession()
  if (!session) return UNAUTH

  const rows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.recipient_type, 'user'),
        eq(notifications.recipient_id, session.sub)
      )
    )
    .orderBy(desc(notifications.created_at))
    .limit(50)

  const unread = rows.filter((r) => !r.is_read).length

  return NextResponse.json({ data: rows, unread })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return UNAUTH

  const body = await req.json().catch(() => ({}))
  const { ids, all } = body as { ids?: string[]; all?: boolean }

  if (all) {
    await db
      .update(notifications)
      .set({ is_read: true, read_at: new Date() })
      .where(
        and(
          eq(notifications.recipient_type, 'user'),
          eq(notifications.recipient_id, session.sub)
        )
      )
  } else if (ids?.length) {
    await db
      .update(notifications)
      .set({ is_read: true, read_at: new Date() })
      .where(
        and(
          eq(notifications.recipient_type, 'user'),
          eq(notifications.recipient_id, session.sub),
          inArray(notifications.id, ids)
        )
      )
  }

  return NextResponse.json({ ok: true })
}
