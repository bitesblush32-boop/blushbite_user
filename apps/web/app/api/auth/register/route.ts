import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { generateAlias } from '@/lib/alias'

const registerSchema = z.object({
  email:    z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: Request) {
  try {
    const body   = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    // Check if email already registered
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      )
    }

    // Hash password — bcrypt cost 12 (250–500ms, OWASP recommended minimum)
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate unique alias — retry on collision (extremely rare)
    let alias: string
    let aliasConflict = true
    let attempts = 0
    do {
      alias = generateAlias()
      const conflict = await db.query.users.findFirst({
        where: eq(users.alias, alias),
      })
      aliasConflict = !!conflict
      attempts++
    } while (aliasConflict && attempts < 10)

    // TODO: add DB insert
    await db.insert(users).values({
      id:                  crypto.randomUUID(),
      email,
      hashedPassword,
      alias,
      role:                'user',
      age_verified:        false,
      onboarding_complete: false,
    })

    return NextResponse.json({ success: true, alias }, { status: 201 })
  } catch (err) {
    console.error('[register] error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
