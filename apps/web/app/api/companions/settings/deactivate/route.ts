import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })
  if (!companion) return NextResponse.json({ error: 'Not a companion' }, { status: 403 })

  await db.update(companionProfiles)
    .set({ is_live: false })
    .where(eq(companionProfiles.companion_id, companion.id))

  return NextResponse.json({ success: true })
}
