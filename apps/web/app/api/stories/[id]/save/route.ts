import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { saves, stories, storyFantasyTags, userFantasyTags } from '@/db/schema'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { createNotification } from '@/db/helpers/createNotification'

// ─── Behavioral inference helper ──────────────────────────────────────────────
// After a save, seed user_fantasy_tags from the story's fantasy tags (into_it intensity)
// Saves signal stronger intent than likes, so intensity is 'into_it'

async function inferTagsFromSave(userId: string, storyId: string): Promise<void> {
  try {
    const storyTags = await db
      .select({ fantasy_tag_id: storyFantasyTags.fantasy_tag_id })
      .from(storyFantasyTags)
      .where(eq(storyFantasyTags.story_id, storyId))

    if (storyTags.length === 0) return

    const tagIds = storyTags.map(t => t.fantasy_tag_id)

    // Upsert: if the tag already exists with a lower intensity, upgrade it
    // 'into_it' (2) > 'curious' (1) — saves are stronger signals
    await db.insert(userFantasyTags)
      .values(tagIds.map(id => ({
        user_id:        userId,
        fantasy_tag_id: id,
        intensity:      'into_it' as const,
        source:         'story_save' as const,
      })))
      .onConflictDoUpdate({
        target: [userFantasyTags.user_id, userFantasyTags.fantasy_tag_id],
        // Only upgrade if current intensity is 'curious' — never downgrade explicit/love_it
        set: {
          intensity: sql`CASE WHEN ${userFantasyTags.intensity} = 'curious' THEN 'into_it' ELSE ${userFantasyTags.intensity} END`,
          source:    sql`CASE WHEN ${userFantasyTags.source} = 'story_like' THEN 'story_save' ELSE ${userFantasyTags.source} END`,
        },
      })
  } catch {
    // Inference must never break the save response
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
      .insert(saves)
      .values({ user_id: userId, content_type: 'story', content_id: storyId })
      .onConflictDoNothing()

    const [updated] = await db
      .update(stories)
      .set({ save_count: sql`${stories.save_count} + 1` })
      .where(eq(stories.id, storyId))
      .returning({ saveCount: stories.save_count, authorId: stories.author_user_id })

    // Behavioral inference — fire-and-forget
    void inferTagsFromSave(userId, storyId)

    try {
      if (updated?.authorId) {
        await createNotification({
          recipientId: updated.authorId,
          actorId:     userId,
          type:        'story_save',
          contentType: 'story',
          contentId:   storyId,
        })
      }
    } catch { /* notification failure must never break the save response */ }

    return NextResponse.json({ saved: true, saveCount: updated?.saveCount ?? 0 })
  } catch (err) {
    console.error('[POST /api/stories/[id]/save]', err)
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
      .delete(saves)
      .where(
        and(
          eq(saves.user_id, userId),
          eq(saves.content_type, 'story'),
          eq(saves.content_id, storyId),
        )
      )

    const [updated] = await db
      .update(stories)
      .set({ save_count: sql`GREATEST(${stories.save_count} - 1, 0)` })
      .where(eq(stories.id, storyId))
      .returning({ saveCount: stories.save_count })

    return NextResponse.json({ saved: false, saveCount: updated?.saveCount ?? 0 })
  } catch (err) {
    console.error('[DELETE /api/stories/[id]/save]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
