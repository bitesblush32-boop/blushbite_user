import { NextRequest, NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otpStore'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  let email: string, otp: string
  try {
    const body = await req.json()
    email = (body.email ?? '').toLowerCase().trim()
    otp = String(body.otp ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: CORS_HEADERS })
  }

  if (!email || !otp) {
    return NextResponse.json(
      { error: 'Email and code are required.' },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  const result = verifyOtp(email, otp)
  if (!result.ok) {
    return NextResponse.json(
      { verified: false, error: result.error },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  return NextResponse.json({ verified: true }, { headers: CORS_HEADERS })
}
