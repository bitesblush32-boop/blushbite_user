import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionProfiles, companionStoryBridges } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getCompanionProfile(email: string) {
  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, email),
    columns: { id: true },
  })
  if (!companion) return null

  let profile = await db.query.companionProfiles.findFirst({
    where: eq(companionProfiles.companion_id, companion.id),
    columns: { id: true },
  })
  if (!profile) {
    const [created] = await db
      .insert(companionProfiles)
      .values({ companion_id: companion.id })
      .onConflictDoNothing()
      .returning({ id: companionProfiles.id })
    profile = created ?? await db.query.companionProfiles.findFirst({
      where: eq(companionProfiles.companion_id, companion.id),
      columns: { id: true },
    })
  }
  return profile ?? null
}

// ─── POST — link companion to story ──────────────────────────────────────────

const postSchema = z.object({ story_id: z.string().uuid() })

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any)?.platform_role as string | undefined
    if (role !== 'companion' && role !== 'dream') {
      return NextResponse.json({ error: 'Companions only' }, { status: 403 })
    }

    const raw = await req.json().catch(() => null)
    const result = postSchema.safeParse(raw)
    if (!result.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    const { story_id } = result.data

    const profile = await getCompanionProfile(session.user.email)
    if (!profile) return NextResponse.json({ error: 'Companion profile not found' }, { status: 404 })

    // Check already linked
    const existing = await db.query.companionStoryBridges.findFirst({
      where: and(
        eq(companionStoryBridges.companion_profile_id, profile.id),
        eq(companionStoryBridges.story_id, story_id),
      ),
      columns: { status: true },
    })
    if (existing) {
      return NextResponse.json({ already_linked: true, status: existing.status })
    }

    // Check < 20 active bridges
    const activeCount = await db
      .select({ count: count() })
      .from(companionStoryBridges)
      .where(and(
        eq(companionStoryBridges.companion_profile_id, profile.id),
        // pending or approved
      ))
    if ((activeCount[0]?.count ?? 0) >= 20) {
      return NextResponse.json({ error: 'Maximum 20 active bridges reached' }, { status: 400 })
    }

    await db.insert(companionStoryBridges).values({
      companion_profile_id: profile.id,
      story_id,
      status: 'approved',
      approved_at: new Date(),
    })

    return NextResponse.json({ success: true, status: 'approved' })
  } catch (err) {
    console.error('[POST /api/companion/bridge]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// ─── GET — check bridge status ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any)?.platform_role as string | undefined
    if (role !== 'companion' && role !== 'dream') {
      return NextResponse.json({ bridged: false, status: null })
    }

    const storyId = req.nextUrl.searchParams.get('story_id')
    if (!storyId) return NextResponse.json({ error: 'story_id required' }, { status: 400 })

    const profile = await getCompanionProfile(session.user.email)
    if (!profile) return NextResponse.json({ bridged: false, status: null })

    const bridge = await db.query.companionStoryBridges.findFirst({
      where: and(
        eq(companionStoryBridges.companion_profile_id, profile.id),
        eq(companionStoryBridges.story_id, storyId),
      ),
      columns: { status: true },
    })

    return NextResponse.json({
      bridged: !!bridge,
      status: bridge?.status ?? null,
    })
  } catch (err) {
    console.error('[GET /api/companion/bridge]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// ─── DELETE — remove pending bridge ──────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any)?.platform_role as string | undefined
    if (role !== 'companion' && role !== 'dream') {
      return NextResponse.json({ error: 'Companions only' }, { status: 403 })
    }

    const storyId = req.nextUrl.searchParams.get('story_id')
    if (!storyId) return NextResponse.json({ error: 'story_id required' }, { status: 400 })

    const profile = await getCompanionProfile(session.user.email)
    if (!profile) return NextResponse.json({ error: 'Companion profile not found' }, { status: 404 })

    const deleted = await db
      .delete(companionStoryBridges)
      .where(and(
        eq(companionStoryBridges.companion_profile_id, profile.id),
        eq(companionStoryBridges.story_id, storyId),
        eq(companionStoryBridges.status, 'pending'),
      ))
      .returning({ id: companionStoryBridges.id })

    if (!deleted.length) {
      return NextResponse.json({ error: 'No pending bridge found — approved bridges cannot be removed' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/companion/bridge]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
