import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { checkRateLimit, storeOtp } from '@/lib/otpStore'

const FROM = process.env.FROM_EMAIL ?? 'admin@blushbite.co'

function buildEmail(otp: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Your BlushBite code</title></head>
<body style="margin:0;padding:0;background:#07090f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#07090f;min-height:100vh;">
<tr><td align="center" style="padding:48px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
<tr><td style="padding-bottom:32px;">
  <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#eeeef0;letter-spacing:0.03em;">BlushBite</span>
</td></tr>
<tr><td style="background:#0d1117;border:1px solid #1c2333;border-radius:16px;overflow:hidden;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="height:2px;background:linear-gradient(90deg,transparent,#e8607a,transparent);line-height:2px;font-size:2px;">&nbsp;</td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding:40px 40px 12px;">
      <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;">Sign in</p>
      <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#eeeef0;line-height:1.3;">
        Your verification <em style="font-style:italic;color:#e8607a;">code</em>
      </h1>
      <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.7;">
        Enter this code to sign in to BlushBite. It expires in <strong style="color:#eeeef0;">10 minutes</strong>.
      </p>
    </td></tr>
    <tr><td style="padding:0 40px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="background:#111620;border:1px solid rgba(232,96,122,0.25);border-radius:12px;text-align:center;padding:28px 24px;">
          <span style="font-family:'Courier New',Courier,monospace;font-size:40px;font-weight:700;letter-spacing:0.3em;color:#eeeef0;display:block;line-height:1;">${otp}</span>
          <span style="display:block;margin-top:12px;font-size:11px;color:#6b7280;letter-spacing:0.05em;text-transform:uppercase;">One-time code &middot; valid 10 min</span>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 40px;"><table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="height:1px;background:#1c2333;font-size:1px;line-height:1px;">&nbsp;</td></tr>
    </table></td></tr>
    <tr><td style="padding:24px 40px 36px;">
      <p style="margin:0;font-size:12px;color:#4b5563;line-height:1.7;">
        If you did not request this, someone entered your email address. You can safely ignore this message.
      </p>
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding-top:28px;">
  <p style="margin:0;font-size:11px;color:#374151;line-height:1.6;">
    &copy; BlushBite &nbsp;&middot;&nbsp; EU-hosted &nbsp;&middot;&nbsp; Your identity stays private.
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  let email: string
  try {
    const body = await req.json()
    email = (body.email ?? '').toLowerCase().trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }

  if (!checkRateLimit(email)) {
    return NextResponse.json(
      { error: 'Too many code requests. Wait 10 minutes before trying again.' },
      { status: 429 }
    )
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000))
  storeOtp(email, otp)

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: `BlushBite <${FROM}>`,
      to: email,
      subject: `${otp} — your BlushBite sign-in code`,
      html: buildEmail(otp),
    })
  } catch (err) {
    console.error('[users/auth/send-otp]', err)
    return NextResponse.json(
      { error: 'Could not send the code. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ sent: true })
}
