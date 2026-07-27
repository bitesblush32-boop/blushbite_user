import { NextRequest, NextResponse } from 'next/server'
import { getSession, buildSessionCookie } from '@/lib/dreamerSession'
import { db } from '@/db'
import { users, userProfiles } from '@/db/schema'
import { eq, ne, and } from 'drizzle-orm'

const UNAUTH = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export async function GET() {
  const session = await getSession()
  if (!session) return UNAUTH

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      alias: users.alias,
      phone: users.phone,
      name: users.name,
      onboarding_complete: users.onboarding_complete,
      // profile fields
      display_name: userProfiles.display_name,
      avatar_url: userProfiles.avatar_url,
      bio: userProfiles.bio,
      date_of_birth: userProfiles.date_of_birth,
      country: userProfiles.country,
      city: userProfiles.city,
      gender: userProfiles.gender,
      desired_genders: userProfiles.desired_genders,
      vibes: userProfiles.vibes,
      platform_role: userProfiles.platform_role,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.user_id, users.id))
    .where(eq(users.id, session.sub))
    .limit(1)

  if (!row) return UNAUTH

  return NextResponse.json({ data: row })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return UNAUTH

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { alias, phone, bio, dateOfBirth, country, city, display_name } = body as Record<
    string,
    string | undefined
  >

  // Alias uniqueness check
  if (alias !== undefined && alias !== null) {
    const clean = (alias as string).startsWith('@') ? (alias as string).slice(1) : (alias as string)
    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.alias, clean), ne(users.id, session.sub)))
      .limit(1)
    if (taken)
      return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 })

    await db
      .update(users)
      .set({ alias: clean, updated_at: new Date() })
      .where(eq(users.id, session.sub))

    // Re-issue cookie with updated alias
    const cookie = await buildSessionCookie({
      sub: session.sub,
      email: session.email,
      alias: clean,
    })
    const [updated] = await db
      .select({
        id: users.id,
        email: users.email,
        alias: users.alias,
        phone: users.phone,
        display_name: userProfiles.display_name,
        avatar_url: userProfiles.avatar_url,
        bio: userProfiles.bio,
        date_of_birth: userProfiles.date_of_birth,
        country: userProfiles.country,
        city: userProfiles.city,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.user_id, users.id))
      .where(eq(users.id, session.sub))
      .limit(1)
    return NextResponse.json({ data: updated }, { headers: { 'Set-Cookie': cookie } })
  }

  if (phone !== undefined) {
    await db
      .update(users)
      .set({ phone: (phone as string) || null, updated_at: new Date() })
      .where(eq(users.id, session.sub))
  }

  // Update user_profiles fields
  const profileUpdates: Record<string, unknown> = {}
  if (bio !== undefined) profileUpdates.bio = (bio as string) || null
  if (dateOfBirth !== undefined) profileUpdates.date_of_birth = (dateOfBirth as string) || null
  if (country !== undefined) profileUpdates.country = (country as string) || null
  if (city !== undefined) profileUpdates.city = (city as string) || null
  if (display_name !== undefined) profileUpdates.display_name = (display_name as string) || null

  if (Object.keys(profileUpdates).length > 0) {
    profileUpdates.updated_at = new Date()
    // Upsert profile row
    const [existing] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.user_id, session.sub))
      .limit(1)
    if (existing) {
      await db.update(userProfiles).set(profileUpdates).where(eq(userProfiles.user_id, session.sub))
    } else {
      await db.insert(userProfiles).values({ user_id: session.sub, ...profileUpdates } as any)
    }
  }

  const [data] = await db
    .select({
      id: users.id,
      email: users.email,
      alias: users.alias,
      phone: users.phone,
      display_name: userProfiles.display_name,
      avatar_url: userProfiles.avatar_url,
      bio: userProfiles.bio,
      date_of_birth: userProfiles.date_of_birth,
      country: userProfiles.country,
      city: userProfiles.city,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.user_id, users.id))
    .where(eq(users.id, session.sub))
    .limit(1)

  return NextResponse.json({ data })
}
