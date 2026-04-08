import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Session } from 'next-auth'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, users, notifications } from '@/db/schema'
import { eq, desc, and, gte, inArray } from 'drizzle-orm'

// ── Resolve recipient type + id from session ──────────────────────────────────

function resolveRecipient(session: Session | null) {
  if (!session?.user?.email) return null

  const isCompanion = session.user.platform_role === 'companion'

  if (isCompanion) {
    // companion_id is stored as session.user.id for companions
    return { recipientType: 'companion' as const, recipientId: session.user.id }
  }

  return { recipientType: 'user' as const, recipientId: session.user.id }
}

// ── GET /api/notifications ────────────────────────────────────────────────────

export async function GET() {
  const session = await auth()
  const recipient = await resolveRecipient(session)
  if (!recipient) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const rows = await db
    .select({
      id:                notifications.id,
      notification_type: notifications.notification_type,
      title:             notifications.title,
      body:              notifications.body,
      action_url:        notifications.action_url,
      metadata:          notifications.metadata,
      is_read:           notifications.is_read,
      created_at:        notifications.created_at,
    })
    .from(notifications)
    .where(and(
      eq(notifications.recipient_type, recipient.recipientType),
      eq(notifications.recipient_id,   recipient.recipientId),
      gte(notifications.created_at,    thirtyDaysAgo),
    ))
    .orderBy(desc(notifications.created_at))
    .limit(30)

  return NextResponse.json({
    notifications: rows,
    unread_count:  rows.filter(n => !n.is_read).length,
  })
}

// ── PATCH /api/notifications — bulk mark as read ──────────────────────────────

const patchSchema = z.object({
  notification_ids: z.array(z.string().uuid()).min(1).max(50),
})

export async function PATCH(req: Request) {
  const session   = await auth()
  const recipient = await resolveRecipient(session)
  if (!recipient) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const now = new Date()

  await db
    .update(notifications)
    .set({ is_read: true, read_at: now })
    .where(and(
      eq(notifications.recipient_type, recipient.recipientType),
      eq(notifications.recipient_id,   recipient.recipientId),
      inArray(notifications.id, parsed.data.notification_ids),
    ))

  return NextResponse.json({ ok: true })
}
