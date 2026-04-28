import { db } from '../index'
import { notifications, users } from '../schema'
import { eq } from 'drizzle-orm'
import { sendPushToUser } from '@/lib/sendPushNotification'

type LegacyType = 'story_like' | 'story_save' | 'story_comment' | 'comment_reply' | 'comment_like'

// Map legacy engagement event types to v2 notification_type values
// and generate the human-readable title + body.
function buildNotifContent(
  type: LegacyType,
  alias: string,
): { notification_type: string; title: string; body: string } {
  switch (type) {
    case 'story_like':
      return { notification_type: 'profile_viewed', title: 'New like',    body: `${alias} liked your confession` }
    case 'story_save':
      return { notification_type: 'profile_viewed', title: 'New save',    body: `${alias} saved your confession` }
    case 'story_comment':
      return { notification_type: 'booking_request', title: 'New comment', body: `${alias} commented on your confession` }
    case 'comment_reply':
      return { notification_type: 'booking_request', title: 'New reply',   body: `${alias} replied to your comment` }
    case 'comment_like':
      return { notification_type: 'profile_viewed', title: 'New like',    body: `${alias} liked your comment` }
  }
}

interface NotifArgs {
  recipientId: string
  actorId:     string
  type:        LegacyType
  contentType: string
  contentId:   string
}

export async function createNotification(args: NotifArgs): Promise<void> {
  // Never notify the user of their own actions
  if (args.recipientId === args.actorId) return

  // Resolve actor alias for push copy — must happen before insert
  let alias = 'Someone'
  try {
    const [actor] = await db
      .select({ alias: users.alias })
      .from(users)
      .where(eq(users.id, args.actorId))
      .limit(1)
    if (actor?.alias) alias = `@${actor.alias}`
  } catch {}

  const { notification_type, title, body } = buildNotifContent(args.type, alias)

  await db
    .insert(notifications)
    .values({
      recipient_type:    'user',
      recipient_id:      args.recipientId,
      notification_type,
      title,
      body,
      metadata: {
        actor_id:     args.actorId,
        content_type: args.contentType,
        content_id:   args.contentId,
      },
    })
    .onConflictDoNothing()

  // Fire push notification — must never throw
  try {
    await sendPushToUser(args.recipientId, { title, body, url: '/notifications' })
  } catch {
    // Push failures must never propagate
  }
}
