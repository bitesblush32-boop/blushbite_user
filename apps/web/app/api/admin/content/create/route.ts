import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { stories, storyMoodTags, storyOrientationTags, storyFantasyTags } from '@/db/schema'

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const {
    title,
    body: storyBody,
    excerpt,
    category_id,
    mood_tag_ids = [],
    orientation_tag_ids = [],
    fantasy_tag_ids = [],
    is_featured = false,
    auto_publish = false,
    is_anonymous = false,
  } = await req.json()

  if (!title?.trim() || !storyBody?.trim()) {
    return NextResponse.json({ error: 'title and body required' }, { status: 400 })
  }

  const now = new Date()

  const [inserted] = await db
    .insert(stories)
    .values({
      title: title.trim(),
      body: storyBody,
      excerpt: excerpt ?? null,
      category_id: category_id ?? null,
      author_type: 'admin',
      author_user_id: null,
      author_companion_id: null,
      is_anonymous,
      is_featured,
      moderation_status: 'approved',
      is_published: auto_publish,
      published_at: auto_publish ? now : null,
      moderated_at: now,
    })
    .returning({ id: stories.id })

  const storyId = inserted.id

  await Promise.all([
    (mood_tag_ids as number[]).length
      ? db
          .insert(storyMoodTags)
          .values(
            (mood_tag_ids as number[]).map((tid) => ({ story_id: storyId, mood_tag_id: tid }))
          )
      : Promise.resolve(),
    (orientation_tag_ids as number[]).length
      ? db.insert(storyOrientationTags).values(
          (orientation_tag_ids as number[]).map((tid) => ({
            story_id: storyId,
            orientation_tag_id: tid,
          }))
        )
      : Promise.resolve(),
    (fantasy_tag_ids as number[]).length
      ? db
          .insert(storyFantasyTags)
          .values(
            (fantasy_tag_ids as number[]).map((tid) => ({ story_id: storyId, fantasy_tag_id: tid }))
          )
      : Promise.resolve(),
  ])

  return NextResponse.json({ success: true, story_id: storyId })
}
