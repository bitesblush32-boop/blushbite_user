import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { pushSubscriptions } from '@/db/schema'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  const body = await req.json()
  const { endpoint, p256dh, auth: authKey } = body as {
    endpoint: string
    p256dh:   string
    auth:     string
  }

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: 'Missing subscription fields' }, { status: 400 })
  }

  await db
    .insert(pushSubscriptions)
    .values({ user_id: userId, endpoint, p256dh, auth: authKey })
    .onConflictDoNothing()

  return NextResponse.json({ ok: true })
}
