import { NextResponse } from 'next/server'
import { db } from '@/db'
import {
  companionStoryBridges, companionProfiles, companions, companionPhotos,
} from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

// ── GET /api/stories/[id]/bridges ─────────────────────────────────────────────
// Public — returns approved companion bridges for a story (max 5).

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
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
    ))
    .limit(5)

  return NextResponse.json({ data: rows })
}
