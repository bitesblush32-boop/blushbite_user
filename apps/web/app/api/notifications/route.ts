import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { notifications, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const actor = users

  const rows = await db
    .select({
      id:           notifications.id,
      type:         notifications.type,
      content_type: notifications.content_type,
      content_id:   notifications.content_id,
      is_read:      notifications.is_read,
      created_at:   notifications.created_at,
      actor_alias:  actor.alias,
      actor_image:  actor.image,
    })
    .from(notifications)
    .leftJoin(actor, eq(actor.id, notifications.actor_id))
    .where(eq(notifications.recipient_id, userId))
    .orderBy(desc(notifications.created_at))
    .limit(30)

  const result = rows.map(r => ({
    id:           r.id,
    type:         r.type,
    content_type: r.content_type,
    content_id:   r.content_id,
    is_read:      r.is_read,
    created_at:   r.created_at,
    actor: {
      alias: r.actor_alias ?? '??',
      image: r.actor_image ?? null,
    },
  }))

  return NextResponse.json({
    notifications: result,
    unread_count:  result.filter(n => !n.is_read).length,
  })
}
