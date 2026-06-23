import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { companions, companionProfiles, companionOnboardingProgress } from '@/db/schema'
import { generateAlias } from '@/lib/alias'

// ─── CORS ─────────────────────────────────────────────────────────────────────
// The static landing page at blushbite.live calls this from a separate origin.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAtLeast18(dob: string): boolean {
  const date = new Date(dob)
  if (isNaN(date.getTime())) return false
  const today = new Date()
  const cutoff = new Date(date.getFullYear() + 18, date.getMonth(), date.getDate())
  return today >= cutoff
}

// ─── Validation ───────────────────────────────────────────────────────────────

const applySchema = z.object({
  // Account
  fullName:    z.string().min(2, 'We need your full legal name.').max(100).trim(),
  email:       z.string().email('Enter a valid email address.').toLowerCase(),
  dateOfBirth: z.string()
    .refine(v => !isNaN(new Date(v).getTime()), 'Enter a valid date of birth.')
    .refine(isAtLeast18, 'You must be 18 or older to apply.'),
  // Location
  country:        z.string().min(1, 'Please select your country.'),
  city:           z.string().min(1, 'Please enter your city.').max(100).trim(),
  whatsappNumber: z.string().regex(/^\+[1-9]\d{6,14}$/, 'Enter a valid WhatsApp number in E.164 format, e.g. +31612345678.'),
  // Profile
  displayName:     z.string().min(1, 'Choose a display name.').max(100).trim().optional(),
  gender:          z.enum(['woman','man','non_binary','trans_woman','trans_man','other','prefer_not_to_say']),
  tagline:         z.string().max(300).trim().optional(),
  bio:             z.string().max(2000).trim().optional(),
})

// ─── POST /api/companions/apply ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Could not read your application. Try again.' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const result = applySchema.safeParse(raw)
  if (!result.success) {
    const msg = result.error.errors[0]?.message ?? 'Something went wrong. Try again.'
    return NextResponse.json({ error: msg }, { status: 400, headers: CORS_HEADERS })
  }

  const {
    fullName, email, dateOfBirth,
    country, city, whatsappNumber,
    displayName, gender, tagline, bio,
  } = result.data

  try {
    // Check for duplicate email
    const existing = await db.query.companions.findFirst({
      where: eq(companions.email, email),
      columns: { id: true },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'An application with this email already exists. Check your inbox or contact support.' },
        { status: 409, headers: CORS_HEADERS },
      )
    }

    // Generate unique alias
    let alias = generateAlias()
    let attempts = 0
    while (attempts < 10) {
      const conflict = await db.query.companions.findFirst({
        where: eq(companions.alias, alias),
        columns: { id: true },
      })
      if (!conflict) break
      alias = generateAlias()
      attempts++
    }

    const now = new Date()

    // Create companion account
    // companion_stage: 3 → appears in admin "Pending" filter immediately
    const [companion] = await db.insert(companions).values({
      email,
      name:                displayName ?? fullName.split(' ')[0],
      alias,
      full_name:           fullName,
      date_of_birth:       dateOfBirth,
      country,
      whatsapp_number:     whatsappNumber || null,
      companion_stage:     3,
      onboarding_complete: false,
      created_at:          now,
      updated_at:          now,
    }).returning({ id: companions.id })

    if (!companion) {
      return NextResponse.json(
        { error: 'Something went wrong creating your account. Please try again.' },
        { status: 500, headers: CORS_HEADERS },
      )
    }

    // Create companion profile
    await db.insert(companionProfiles).values({
      companion_id:        companion.id,
      bio:                 bio || null,
      tagline:             tagline || null,
      city:                city || null,
      gender:              gender || null,
      availability_status: 'offline',
      whatsapp_number:     whatsappNumber || null,
      is_verified:         false,
      is_live:             false,
      profile_completeness: 0,
      is_visible_to_users:  false,
      created_at:           now,
      updated_at:           now,
    })

    // Log onboarding progress: stages 1 (account created) + 2 (identity) as completed
    await db.insert(companionOnboardingProgress).values([
      { companion_id: companion.id, stage: 1, status: 'completed', completed_at: now, notes: 'Applied via landing page' },
      { companion_id: companion.id, stage: 2, status: 'completed', completed_at: now, notes: null },
    ]).onConflictDoNothing()

    return NextResponse.json(
      { success: true, message: 'Application received. We will be in touch within 48 hours.' },
      { status: 201, headers: CORS_HEADERS },
    )
  } catch (err) {
    console.error('[POST /api/companions/apply]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500, headers: CORS_HEADERS },
    )
  }
}
