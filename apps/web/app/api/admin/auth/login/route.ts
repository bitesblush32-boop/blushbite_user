import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { email, password } = body as { email?: string; password?: string }

  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const secret = process.env.ADMIN_SESSION_SECRET

  if (!adminEmail || !adminPassword || !secret) {
    return NextResponse.json({ error: 'Admin credentials not configured.' }, { status: 500 })
  }

  const valid =
    email?.trim().toLowerCase() === adminEmail.toLowerCase() && password === adminPassword

  if (!valid) {
    // Uniform delay to prevent timing attacks
    await new Promise((r) => setTimeout(r, 400))
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  return res
}
