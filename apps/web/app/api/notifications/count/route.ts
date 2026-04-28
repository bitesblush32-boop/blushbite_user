import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'

// ── GET /api/notifications/count — fast unread badge count ────────────────────

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ unread: 0 })

  const isCompanion = session.user.platform_role === 'companion'

  const recipientType = isCompanion ? 'companion' : 'user'
  const recipientId   = session.user.id

  const [{ unread }] = await db
    .select({ unread: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(
      eq(notifications.recipient_type, recipientType),
      eq(notifications.recipient_id,   recipientId),
      eq(notifications.is_read,        false),
    ))

  return NextResponse.json({ unread })
}
