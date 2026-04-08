import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sendPushToUser } from '@/lib/sendPushNotification'

// DEV ONLY — sends a test push to the currently signed-in user
// Hit: POST /api/dev/test-push
export async function POST(_req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await sendPushToUser(session.user.id, {
    title: 'BlushBite test',
    body:  'Push notifications are working ✓',
    url:   '/notifications',
  })

  return NextResponse.json({ ok: true, userId: session.user.id })
}
