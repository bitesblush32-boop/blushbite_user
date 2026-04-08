import { db } from '../index'
import { notifications, users } from '../schema'
import { eq } from 'drizzle-orm'
import { sendPushToUser } from '@/lib/sendPushNotification'

interface NotifArgs {
  recipientId: string
  actorId:     string
  type:        'story_like' | 'story_save' | 'story_comment' | 'comment_reply' | 'comment_like'
  contentType: string
  contentId:   string
}

function pushCopy(
  type: NotifArgs['type'],
  alias: string,
): { title: string; body: string } {
  switch (type) {
    case 'story_like':    return { title: 'New like',     body: `${alias} liked your confession` }
    case 'story_save':    return { title: 'New save',     body: `${alias} saved your confession` }
    case 'story_comment': return { title: 'New comment',  body: `${alias} commented on your confession` }
    case 'comment_reply': return { title: 'New reply',    body: `${alias} replied to your comment` }
    case 'comment_like':  return { title: 'New like',     body: `${alias} liked your comment` }
  }
}

export async function createNotification(args: NotifArgs): Promise<void> {
  // Never notify the user of their own actions
  if (args.recipientId === args.actorId) return

  await db
    .insert(notifications)
    .values({
      recipient_id: args.recipientId,
      actor_id:     args.actorId,
      type:         args.type,
      content_type: args.contentType,
      content_id:   args.contentId,
    })
    .onConflictDoNothing()

  // Fire push notification — must never throw
  try {
    const [actor] = await db
      .select({ alias: users.alias })
      .from(users)
      .where(eq(users.id, args.actorId))
      .limit(1)

    const alias = actor?.alias ? `@${actor.alias}` : 'Someone'
    const { title, body } = pushCopy(args.type, alias)

    await sendPushToUser(args.recipientId, { title, body, url: '/notifications' })
  } catch {
    // Push failures must never propagate
  }
}
