import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionProfiles, companionStoryBridges, stories } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'

const schema = z.object({
  story_id: z.string().uuid(),
})

// ── POST /api/companion/bridge/link ───────────────────────────────────────────

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { story_id } = parsed.data

  // Resolve companion
  const companionRow = await db
    .select({ id: companions.id })
    .from(companions)
    .where(eq(companions.email, session.user.email))
    .limit(1)

  if (!companionRow.length) return NextResponse.json({ error: 'Not a companion' }, { status: 403 })

  const profileRow = await db
    .select({ id: companionProfiles.id })
    .from(companionProfiles)
    .where(eq(companionProfiles.companion_id, companionRow[0].id))
    .limit(1)

  if (!profileRow.length) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const profileId = profileRow[0].id

  // Check story exists and is published
  const storyRow = await db
    .select({ id: stories.id, is_published: stories.is_published })
    .from(stories)
    .where(eq(stories.id, story_id))
    .limit(1)

  if (!storyRow.length || !storyRow[0].is_published) {
    return NextResponse.json({ error: 'Story not found or not published' }, { status: 404 })
  }

  // Check not already linked
  const existing = await db
    .select({ id: companionStoryBridges.id })
    .from(companionStoryBridges)
    .where(and(
      eq(companionStoryBridges.companion_profile_id, profileId),
      eq(companionStoryBridges.story_id, story_id),
    ))
    .limit(1)

  if (existing.length) {
    return NextResponse.json({ error: 'Already linked to this story' }, { status: 409 })
  }

  // Check 20-link cap
  const [{ total }] = await db
    .select({ total: count() })
    .from(companionStoryBridges)
    .where(eq(companionStoryBridges.companion_profile_id, profileId))

  if (total >= 20) {
    return NextResponse.json({ error: 'Maximum 20 bridge links allowed' }, { status: 422 })
  }

  // Insert bridge
  await db.insert(companionStoryBridges).values({
    companion_profile_id: profileId,
    story_id,
    status: 'pending',
  })

  // TODO: Create admin notification once admin notification system is built

  return NextResponse.json({
    success: true,
    message: 'Your link is pending admin approval',
  })
}
