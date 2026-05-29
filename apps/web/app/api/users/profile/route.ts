import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { users, userProfiles, userFantasyTags, fantasyTags } from '@/db/schema'

// ─── GET /api/users/profile ───────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const rows = await db
      .select({
        id:              users.id,
        email:           users.email,
        name:            users.name,
        image:           users.image,
        alias:           users.alias,
        created_at:      users.created_at,
        profile_id:      userProfiles.id,
        gender:          userProfiles.gender,
        desired_genders: userProfiles.desired_genders,
        vibes:           userProfiles.vibes,
        platform_role:   userProfiles.platform_role,
        mood_intensity:  userProfiles.mood_intensity,
        display_name:    userProfiles.display_name,
        avatar_url:      userProfiles.avatar_url,
        bio:             userProfiles.bio,
        date_of_birth:   userProfiles.date_of_birth,
        country:         userProfiles.country,
        city:            userProfiles.city,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.user_id, users.id))
      .where(eq(users.id, userId))
      .limit(1)

    if (!rows.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Include current fantasy tag IDs with intensities for the DesiresDrawer
    const fantasyTagRows = await db
      .select({
        fantasy_tag_id: userFantasyTags.fantasy_tag_id,
        intensity:      userFantasyTags.intensity,
      })
      .from(userFantasyTags)
      .where(eq(userFantasyTags.user_id, userId))

    return NextResponse.json({
      data: {
        ...rows[0],
        fantasy_tags: fantasyTagRows,
      },
    }, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
    })
  } catch (err) {
    console.error('[GET /api/users/profile]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 })
  }
}

// ─── PATCH /api/users/profile ─────────────────────────────────────────────────

const patchSchema = z.discriminatedUnion('section', [
  // Taste section — vibes, gender preferences
  z.object({
    section:        z.literal('taste'),
    vibes:          z.array(z.string()).max(10).optional(),
    gender:         z.string().max(60).optional(),
    desiredGenders: z.array(z.string()).optional(),
  }),
  // Fantasy tags section — explicit tag selection from DesiresDrawer
  z.object({
    section:      z.literal('fantasy_tags'),
    fantasy_tags: z.array(z.object({
      fantasy_tag_id: z.number(),
      intensity:      z.enum(['curious', 'into_it', 'love_it']),
    })).max(30),
  }),
  // Mood sync — debounced from moodStore
  z.object({
    section:       z.literal('mood'),
    mood_intensity: z.number().int().min(0).max(100),
  }),
  // Profile info
  z.object({
    section:     z.literal('info'),
    alias:       z.string().max(100).optional(),
    bio:         z.string().max(300).optional(),
    dateOfBirth: z.string().optional(),
    country:     z.string().max(100).optional(),
    city:        z.string().max(100).optional(),
  }),
  // Backwards compat — flat patch (no section)
  z.object({
    section:        z.undefined(),
    alias:          z.string().max(100).optional(),
    bio:            z.string().max(300).optional(),
    dateOfBirth:    z.string().optional(),
    country:        z.string().max(100).optional(),
    city:           z.string().max(100).optional(),
    vibes:          z.array(z.string()).max(10).optional(),
    gender:         z.string().max(60).optional(),
    desiredGenders: z.array(z.string()).optional(),
    mood_intensity: z.number().int().min(0).max(100).optional(),
  }),
])

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    let raw: unknown
    try {
      raw = await req.json()
    } catch {
      return NextResponse.json({ error: 'Something slipped — try sending again.' }, { status: 400 })
    }

    const result = patchSchema.safeParse(raw)
    if (!result.success) {
      const firstError = result.error.errors[0]?.message ?? 'Invalid input.'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const now = new Date()
    const data = result.data

    // ── Fantasy tags section ─────────────────────────────────────────────────
    if (data.section === 'fantasy_tags') {
      const { fantasy_tags } = data

      // Validate that the tag IDs exist
      const tagIds = fantasy_tags.map(t => t.fantasy_tag_id)
      if (tagIds.length > 0) {
        const existing = await db
          .select({ id: fantasyTags.id })
          .from(fantasyTags)
          .where(inArray(fantasyTags.id, tagIds))
        const existingIds = new Set(existing.map(r => r.id))
        const invalid = tagIds.filter(id => !existingIds.has(id))
        if (invalid.length > 0) {
          return NextResponse.json({ error: `Unknown tag IDs: ${invalid.join(', ')}` }, { status: 400 })
        }
      }

      // Delete all explicit tags, then reinsert the selected set
      await db.delete(userFantasyTags).where(eq(userFantasyTags.user_id, userId))

      if (fantasy_tags.length > 0) {
        await db.insert(userFantasyTags).values(
          fantasy_tags.map(t => ({
            user_id:        userId,
            fantasy_tag_id: t.fantasy_tag_id,
            intensity:      t.intensity,
            source:         'explicit' as const,
          }))
        ).onConflictDoNothing()
      }

      return NextResponse.json({ data: { updated: true } })
    }

    // ── Mood sync ────────────────────────────────────────────────────────────
    if (data.section === 'mood') {
      await db
        .insert(userProfiles)
        .values({ user_id: userId, mood_intensity: data.mood_intensity, updated_at: now })
        .onConflictDoUpdate({
          target: userProfiles.user_id,
          set: { mood_intensity: data.mood_intensity, updated_at: now },
        })
      return NextResponse.json({ data: { updated: true } })
    }

    // ── Taste / info / legacy flat ───────────────────────────────────────────
    const {
      alias, bio, dateOfBirth, country, city,
      vibes, gender, desiredGenders, mood_intensity,
    } = data as {
      alias?: string; bio?: string; dateOfBirth?: string; country?: string; city?: string
      vibes?: string[]; gender?: string; desiredGenders?: string[]; mood_intensity?: number
    }

    if (alias !== undefined) {
      await db.update(users).set({ alias, updated_at: now }).where(eq(users.id, userId))
    }

    const updated = await db
      .insert(userProfiles)
      .values({
        user_id:         userId,
        bio:             bio ?? null,
        date_of_birth:   dateOfBirth ?? null,
        country:         country ?? null,
        city:            city ?? null,
        vibes:           vibes ?? null,
        gender:          gender ?? null,
        desired_genders: desiredGenders ?? null,
        ...(mood_intensity !== undefined && { mood_intensity }),
        updated_at:      now,
      })
      .onConflictDoUpdate({
        target: userProfiles.user_id,
        set: {
          ...(bio            !== undefined && { bio }),
          ...(dateOfBirth    !== undefined && { date_of_birth:   dateOfBirth }),
          ...(country        !== undefined && { country }),
          ...(city           !== undefined && { city }),
          ...(vibes          !== undefined && { vibes }),
          ...(gender         !== undefined && { gender }),
          ...(desiredGenders !== undefined && { desired_genders: desiredGenders }),
          ...(mood_intensity !== undefined && { mood_intensity }),
          updated_at: now,
        },
      })
      .returning()

    return NextResponse.json({ data: updated[0] })
  } catch (err) {
    console.error('[PATCH /api/users/profile]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 })
  }
}
