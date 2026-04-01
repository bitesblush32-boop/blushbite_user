import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, userProfiles } from '@/db/schema'

// ─── GET /api/user/profile ────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // TODO DB: Phase 2 — replace with TanStack Query hook; add pgvector preference embedding here
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

    return NextResponse.json({ data: rows[0] })
  } catch (err) {
    console.error('[GET /api/user/profile]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 })
  }
}

// ─── PATCH /api/user/profile ──────────────────────────────────────────────────

const patchSchema = z.object({
  displayName:   z.string().max(100).optional(),
  bio:           z.string().max(300).optional(),
  dateOfBirth:   z.string().optional(),
  country:       z.string().max(100).optional(),
  city:          z.string().max(100).optional(),
})

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

    const { displayName, bio, dateOfBirth, country, city } = result.data
    const now = new Date()

    // TODO DB: Phase 2 — trigger pgvector embedding recompute on vibe/tag change
    const updated = await db
      .insert(userProfiles)
      .values({
        user_id:       userId,
        display_name:  displayName ?? null,
        bio:           bio ?? null,
        date_of_birth: dateOfBirth ?? null,
        country:       country ?? null,
        city:          city ?? null,
        updated_at:    now,
      })
      .onConflictDoUpdate({
        target: userProfiles.user_id,
        set: {
          ...(displayName  !== undefined && { display_name:  displayName }),
          ...(bio          !== undefined && { bio }),
          ...(dateOfBirth  !== undefined && { date_of_birth: dateOfBirth }),
          ...(country      !== undefined && { country }),
          ...(city         !== undefined && { city }),
          updated_at: now,
        },
      })
      .returning()

    return NextResponse.json({ data: updated[0] })
  } catch (err) {
    console.error('[PATCH /api/user/profile]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 })
  }
}
