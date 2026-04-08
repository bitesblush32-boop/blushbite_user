import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })
  if (!companion) return NextResponse.json({ error: 'Not a companion' }, { status: 403 })
  if (!companion.hashed_password) return NextResponse.json({ error: 'No password set' }, { status: 400 })

  const { currentPassword, newPassword } = await req.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Both passwords required' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
  }

  const valid = await bcrypt.compare(currentPassword, companion.hashed_password)
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })

  const hash = await bcrypt.hash(newPassword, 12)
  await db.update(companions)
    .set({ hashed_password: hash })
    .where(eq(companions.id, companion.id))

  return NextResponse.json({ success: true })
}
