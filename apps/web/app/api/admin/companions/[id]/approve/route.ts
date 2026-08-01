import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { companions, companionProfiles, companionOnboardingProgress } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { id } = params
  const now = new Date()

  // 1. Set is_live + verified
  await db
    .update(companionProfiles)
    .set({ is_live: true, approved_at: now, is_verified: true, verified_at: now })
    .where(eq(companionProfiles.companion_id, id))

  // 2. Upsert onboarding stage 7 = completed
  await db
    .insert(companionOnboardingProgress)
    .values({
      companion_id: id,
      stage: 7,
      status: 'completed',
      completed_at: now,
      notes: null,
    })
    .onConflictDoUpdate({
      target: [companionOnboardingProgress.companion_id, companionOnboardingProgress.stage],
      set: { status: 'completed', completed_at: now, notes: null },
    })

  // 3. Send approval email
  try {
    const [companion] = await db
      .select({ email: companions.email, name: companions.name })
      .from(companions)
      .where(eq(companions.id, id))
      .limit(1)

    if (companion) {
      const firstName = (companion.name ?? 'there').split(' ')[0]
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: `BlushBite <${process.env.FROM_EMAIL ?? 'admin@blushbite.co'}>`,
        to: companion.email,
        subject: "You're in — your BlushBite application is approved",
        html: buildApprovalEmail(firstName),
      })
    }
  } catch (err) {
    console.error('[approve] email send failed:', err)
    // Non-fatal — approval is already saved in DB
  }

  return NextResponse.json({ success: true })
}

function buildApprovalEmail(firstName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're approved — BlushBite</title>
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
          <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#e8607a;">Account update</p>
          <!-- heading -->
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#eeeef0;line-height:1.35;">
            Your profile is <em style="font-style:italic;color:#e8607a;">verified.</em>
          </h1>
          <!-- body copy -->
          <p style="margin:0 0 16px;font-size:15px;color:#9ca3af;line-height:1.7;">
            Hi ${firstName} — our team has reviewed your profile and marked it as <strong style="color:#eeeef0;">verified.</strong>
          </p>
          <p style="margin:0 0 28px;font-size:15px;color:#9ca3af;line-height:1.7;">
            Your verified badge is now visible. Sign in to your companion portal to complete your profile, upload photos, and go live whenever you're ready.
          </p>
          <!-- CTA button -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr>
              <td style="background:#e8607a;border-radius:10px;">
                <a href="https://blushbite.live/login"
                   style="display:inline-block;padding:13px 28px;color:#fff;font-size:14px;font-weight:500;text-decoration:none;letter-spacing:0.01em;">
                  Sign in to your portal →
                </a>
              </td>
            </tr>
          </table>
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
