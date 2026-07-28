import { NextResponse } from 'next/server'
import { getSession } from '@/lib/dreamerSession'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'

const UNAUTH = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export async function GET() {
  const session = await getSession()
  if (!session) return UNAUTH

  const [row] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipient_type, 'user'),
        eq(notifications.recipient_id, session.sub),
        eq(notifications.is_read, false)
      )
    )

  return NextResponse.json({ count: row?.count ?? 0 })
}
