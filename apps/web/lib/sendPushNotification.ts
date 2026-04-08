import webpush from 'web-push'
import { db } from '@/db'
import { pushSubscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'

let vapidInitialized = false

function initVapid() {
  if (vapidInitialized) return
  const subject   = process.env.VAPID_SUBJECT
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  // Skip silently if VAPID env vars not yet configured
  if (!subject || !publicKey || !privateKey) return
  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidInitialized = true
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  try {
    initVapid()
    if (!vapidInitialized) return // VAPID not configured yet — skip silently
    const subs = await db
      .select({
        endpoint: pushSubscriptions.endpoint,
        p256dh:   pushSubscriptions.p256dh,
        auth:     pushSubscriptions.auth,
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.user_id, userId))

    await Promise.allSettled(
      subs.map(sub =>
        webpush
          .sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload),
          )
          .catch(async (err: any) => {
            // 410 Gone = subscription expired — clean it up silently
            if (err?.statusCode === 410) {
              await db
                .delete(pushSubscriptions)
                .where(eq(pushSubscriptions.endpoint, sub.endpoint))
                .catch(() => {})
            }
          }),
      ),
    )
  } catch {
    // Push failures must never propagate to callers
  }
}
