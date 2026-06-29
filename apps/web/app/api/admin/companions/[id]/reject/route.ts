import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { companions, companionOnboardingProgress } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { reason } = await req.json()
  const now = new Date()

  await db
    .insert(companionOnboardingProgress)
    .values({
      companion_id: params.id,
      stage: 7,
      status: 'rejected',
      completed_at: now,
      notes: reason ?? null,
    })
    .onConflictDoUpdate({
      target: [companionOnboardingProgress.companion_id, companionOnboardingProgress.stage],
      set: { status: 'rejected', completed_at: now, notes: reason ?? null },
    })

  // Send rejection email
  try {
    const [companion] = await db
      .select({ email: companions.email, name: companions.name })
      .from(companions)
      .where(eq(companions.id, params.id))
      .limit(1)

    if (companion) {
      const firstName = (companion.name ?? 'there').split(' ')[0]
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: `BlushBite <${process.env.FROM_EMAIL ?? 'admin@blushbite.co'}>`,
        to: companion.email,
        subject: 'Your BlushBite application — an update',
        html: buildRejectionEmail(firstName, reason ?? null),
      })
    }
  } catch (err) {
    console.error('[reject] email send failed:', err)
    // Non-fatal — rejection is already saved in DB
  }

  return NextResponse.json({ success: true })
}

function buildRejectionEmail(firstName: string, reason: string | null): string {
  const reasonBlock = reason
    ? `<p style="margin:0 0 16px;font-size:15px;color:#9ca3af;line-height:1.7;">
         <strong style="color:#eeeef0;">Feedback from our team:</strong><br />
         ${reason}
       </p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your BlushBite application — BlushBite</title>
</head>
<body style="margin:0;padding:0;background:#07090f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07090f;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <!-- accent line -->
        <tr><td style="height:2px;background:linear-gradient(90deg,transparent,#e8607a,transparent);border-radius:2px;"></td></tr>
        <!-- body -->
        <tr><td style="background:#0d1117;border:1px solid #1c2333;border-top:none;border-radius:0 0 20px 20px;padding:40px 36px;">
          <!-- logo -->
          <p style="margin:0 0 32px;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#eeeef0;letter-spacing:0.03em;">BlushBite</p>
          <!-- eyebrow -->
          <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#e8607a;">Application update</p>
          <!-- heading -->
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#eeeef0;line-height:1.35;">
            Hi, <em style="font-style:italic;color:#e8607a;">${firstName}.</em>
          </h1>
          <!-- body copy -->
          <p style="margin:0 0 16px;font-size:15px;color:#9ca3af;line-height:1.7;">
            Thank you for applying to BlushBite. After reviewing your application, we're not able to move forward at this time.
          </p>
          ${reasonBlock}
          <p style="margin:0 0 28px;font-size:15px;color:#9ca3af;line-height:1.7;">
            We appreciate you taking the time to apply, and we wish you all the best.
          </p>
          <!-- divider -->
          <div style="height:1px;background:#1c2333;margin-bottom:24px;"></div>
          <!-- footer note -->
          <p style="margin:0;font-size:12px;color:#374151;line-height:1.6;">
            Questions? Reply to this email — we read every message.<br />
            <a href="https://blushbite.live" style="color:#6b7280;text-decoration:none;">blushbite.live</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
