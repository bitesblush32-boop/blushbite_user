import { db } from '../index'
import { notifications } from '../schema'

interface NotifArgs {
  recipientId: string
  actorId:     string
  type:        'story_like' | 'story_save' | 'story_comment' | 'comment_reply' | 'comment_like'
  contentType: string
  contentId:   string
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
}
