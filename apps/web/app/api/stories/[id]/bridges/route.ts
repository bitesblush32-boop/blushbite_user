import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import {
  companionStoryBridges, companionProfiles, companions, companionPhotos,
} from '@/db/schema'
import { eq, and, isNull, asc } from 'drizzle-orm'

// ── GET /api/stories/[id]/bridges ─────────────────────────────────────────────
// Public — returns approved, visible companion bridges for a story (max 20).

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id: storyId } = params

    const rows = await db
      .select({
        id:                  companionProfiles.id,
        companion_id:        companionProfiles.companion_id,
        alias:               companions.alias,
        name:                companions.name,
        tagline:             companionProfiles.tagline,
        city:                companionProfiles.city,
        availability_status: companionProfiles.availability_status,
        is_visible_to_users: companionProfiles.is_visible_to_users,
        photo_url:           companionPhotos.url,
      })
      .from(companionStoryBridges)
      .innerJoin(companionProfiles, eq(companionProfiles.id, companionStoryBridges.companion_profile_id))
      .innerJoin(companions, eq(companions.id, companionProfiles.companion_id))
      .leftJoin(
        companionPhotos,
        and(
          eq(companionPhotos.companion_profile_id, companionProfiles.id),
          eq(companionPhotos.is_primary, true),
          isNull(companionPhotos.deleted_at),
        ),
      )
      .where(and(
        eq(companionStoryBridges.story_id, storyId),
        eq(companionStoryBridges.status, 'approved'),
        eq(companionProfiles.is_visible_to_users, true),
      ))
      .orderBy(asc(companionStoryBridges.approved_at))
      .limit(20)

    return NextResponse.json({ data: rows })
  } catch (err) {
    console.error('[GET /api/stories/[id]/bridges]', err)
    return NextResponse.json({ data: [] })
  }
}
