import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { pushSubscriptions } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  const body = await req.json()
  const { endpoint } = body as { endpoint: string }

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
  }

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.user_id, userId),
        eq(pushSubscriptions.endpoint, endpoint),
      )
    )

  return NextResponse.json({ ok: true })
}
