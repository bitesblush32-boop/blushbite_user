import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { likes, stories, storyFantasyTags, userFantasyTags } from '@/db/schema'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { createNotification } from '@/db/helpers/createNotification'

// ─── Behavioral inference helper ──────────────────────────────────────────────
// After a like, seed user_fantasy_tags from the story's fantasy tags (curious intensity)

async function inferTagsFromStory(userId: string, storyId: string): Promise<void> {
  try {
    const storyTags = await db
      .select({ fantasy_tag_id: storyFantasyTags.fantasy_tag_id })
      .from(storyFantasyTags)
      .where(eq(storyFantasyTags.story_id, storyId))

    if (storyTags.length === 0) return

    // Get already-explicit tags so we don't downgrade them
    const existingExplicit = await db
      .select({ fantasy_tag_id: userFantasyTags.fantasy_tag_id })
      .from(userFantasyTags)
      .where(and(
        eq(userFantasyTags.user_id, userId),
        inArray(userFantasyTags.fantasy_tag_id, storyTags.map(t => t.fantasy_tag_id))
      ))
    const explicitIds = new Set(existingExplicit.map(r => r.fantasy_tag_id))

    const toInsert = storyTags
      .filter(t => !explicitIds.has(t.fantasy_tag_id))
      .map(t => ({
        user_id:        userId,
        fantasy_tag_id: t.fantasy_tag_id,
        intensity:      'curious' as const,
        source:         'story_like' as const,
      }))

    if (toInsert.length === 0) return

    await db.insert(userFantasyTags)
      .values(toInsert)
      .onConflictDoNothing()
  } catch {
    // Inference must never break the like response
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id: storyId } = await params
    const userId = session.user.id

    await db
      .insert(likes)
      .values({ user_id: userId, content_type: 'story', content_id: storyId })
      .onConflictDoNothing()

    const [updated] = await db
      .update(stories)
      .set({ like_count: sql`${stories.like_count} + 1` })
      .where(eq(stories.id, storyId))
      .returning({ likeCount: stories.like_count, authorId: stories.author_user_id })

    // Behavioral inference — fire-and-forget, does not block response
    void inferTagsFromStory(userId, storyId)

    try {
      if (updated?.authorId) {
        await createNotification({
          recipientId: updated.authorId,
          actorId:     userId,
          type:        'story_like',
          contentType: 'story',
          contentId:   storyId,
        })
      }
    } catch { /* notification failure must never break the like response */ }

    return NextResponse.json({ liked: true, likeCount: updated?.likeCount ?? 0 })
  } catch (err) {
    console.error('[POST /api/stories/[id]/like]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id: storyId } = await params
    const userId = session.user.id

    await db
      .delete(likes)
      .where(
        and(
          eq(likes.user_id, userId),
          eq(likes.content_type, 'story'),
          eq(likes.content_id, storyId),
        )
      )

    const [updated] = await db
      .update(stories)
      .set({ like_count: sql`GREATEST(${stories.like_count} - 1, 0)` })
      .where(eq(stories.id, storyId))
      .returning({ likeCount: stories.like_count })

    return NextResponse.json({ liked: false, likeCount: updated?.likeCount ?? 0 })
  } catch (err) {
    console.error('[DELETE /api/stories/[id]/like]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
