import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionProfiles, stories, companionPhotos, companionVideos } from '@/db/schema'
import { eq, and, isNull, desc } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })
  if (!companion) return NextResponse.json({ error: 'Not a companion' }, { status: 403 })

  const profile = await db.query.companionProfiles.findFirst({
    where: eq(companionProfiles.companion_id, companion.id),
  })

  const [storiesData, photosData, videosData] = await Promise.all([
    db.select({
      id:                stories.id,
      title:             stories.title,
      excerpt:           stories.excerpt,
      is_anonymous:      stories.is_anonymous,
      is_published:      stories.is_published,
      moderation_status: stories.moderation_status,
      view_count:        stories.view_count,
      like_count:        stories.like_count,
      created_at:        stories.created_at,
    })
      .from(stories)
      .where(and(
        eq(stories.author_companion_id, companion.id),
        isNull(stories.deleted_at),
      ))
      .orderBy(desc(stories.created_at)),

    profile
      ? db.select({
          id:          companionPhotos.id,
          url:         companionPhotos.url,
          alt_text:    companionPhotos.alt_text,
          is_primary:  companionPhotos.is_primary,
          is_approved: companionPhotos.is_approved,
          created_at:  companionPhotos.created_at,
        })
          .from(companionPhotos)
          .where(and(
            eq(companionPhotos.companion_profile_id, profile.id),
            isNull(companionPhotos.deleted_at),
          ))
          .orderBy(desc(companionPhotos.created_at))
      : Promise.resolve([]),

    profile
      ? db.select({
          id:               companionVideos.id,
          url:              companionVideos.url,
          duration_seconds: companionVideos.duration_seconds,
          thumbnail_url:    companionVideos.thumbnail_url,
          is_approved:      companionVideos.is_approved,
          created_at:       companionVideos.created_at,
        })
          .from(companionVideos)
          .where(and(
            eq(companionVideos.companion_profile_id, profile.id),
            isNull(companionVideos.deleted_at),
          ))
          .orderBy(desc(companionVideos.created_at))
      : Promise.resolve([]),
  ])

  return NextResponse.json({
    confessions: storiesData.filter(s => s.is_anonymous),
    stories:     storiesData.filter(s => !s.is_anonymous),
    photos:      photosData,
    videos:      videosData,
  })
}
