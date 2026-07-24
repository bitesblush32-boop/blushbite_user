import { NextResponse } from 'next/server'
import { getSession } from '@/lib/dreamerSession'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null })

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      alias: users.alias,
      name: users.name,
      phone: users.phone,
      onboarding_complete: users.onboarding_complete,
    })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1)

  if (!row) return NextResponse.json({ user: null })

  return NextResponse.json({ user: row })
}
