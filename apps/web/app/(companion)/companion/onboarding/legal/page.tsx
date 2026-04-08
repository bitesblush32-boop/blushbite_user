'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react'

const TOS_TEXT = `BlushBite is a curated discovery platform connecting adult companions with potential clients. By joining as a companion you agree to: maintain accurate and truthful profile information at all times; comply with all applicable laws in your jurisdiction regarding adult services; not engage in deceptive, misleading, or fraudulent conduct toward clients or the platform; keep your identity verification documents current and valid; respond to client enquiries in a timely and professional manner; immediately notify BlushBite of any change in your legal status or ability to provide services. BlushBite reserves the right to suspend or terminate any profile that violates these terms, with written notice provided where legally required. Disputes are governed by Dutch law and subject to exclusive jurisdiction of courts in Amsterdam.`

const MODEL_RELEASE_TEXT = `You grant BlushBite B.V. a non-exclusive, royalty-free, worldwide licence to display, reproduce and promote any content you voluntarily upload to the platform ("Content") solely for the purpose of operating and marketing the BlushBite service. This licence terminates within 30 days of a valid written removal request. You represent and warrant that: you are the sole creator and rights-holder of all Content; no Content infringes any third-party intellectual property, privacy, or publicity rights; all individuals depicted in Content have provided you with written, informed consent for such depiction in an adult context. BlushBite does not claim ownership of your Content and will not license it to third parties without separate written agreement.`

function DocBlock({ chipColor, chipLabel, summaryBullets, bodyText, checkLabel, checked, onCheck }: {
  chipColor: 'gold' | 'rose'
  chipLabel: string
  summaryBullets: string[]
  bodyText?: string
  checkLabel: string
  checked: boolean
  onCheck: (v: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const chipStyle: React.CSSProperties = chipColor === 'gold'
    ? { color: '#c9a96e', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.3)' }
    : { color: '#e8607a', background: 'rgba(232,96,122,0.08)', border: '1px solid rgba(232,96,122,0.3)' }

  return (
    <div style={{ background: '#0d1117', border: '1px solid #1c2333', borderRadius: 16, padding: 20, marginBottom: 12 }}>
      <span style={{ ...chipStyle, display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 999, letterSpacing: '0.04em', marginBottom: 14 }}>
        {chipLabel}
      </span>

      {/* Summary bullets */}
      <ul style={{ margin: '0 0 14px 0', padding: 0, listStyle: 'none' }}>
        {summaryBullets.map((b, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#6b7280', lineHeight: 1.5, marginBottom: 4 }}>
            <span style={{ color: chipColor === 'gold' ? '#c9a96e' : '#e8607a', marginTop: 1, flexShrink: 0 }}>·</span>
            {b}
          </li>
        ))}
      </ul>

      {/* Collapsible full text */}
      {bodyText && (
        <div style={{ marginBottom: 14 }}>
          {expanded && (
            <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 8, padding: '10px 12px', background: '#07090f', borderRadius: 8, border: '1px solid #1c2333' }}>
              <p style={{ fontSize: 11.5, color: '#6b7280', lineHeight: 1.7, margin: 0 }}>{bodyText}</p>
            </div>
          )}
          <button type="button" onClick={() => setExpanded(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#6b7280', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            {expanded ? <><ChevronUp size={13} /> Hide terms</> : <><ChevronDown size={13} /> Read full terms</>}
          </button>
        </div>
      )}

      {/* Checkbox */}
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
        <div
          onClick={() => onCheck(!checked)}
          style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
            border: checked ? '1.5px solid #e8607a' : '1.5px solid #1c2333',
            background: checked ? 'rgba(232,96,122,0.15)' : '#161d2a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
          {checked && <div style={{ width: 8, height: 8, borderRadius: 2, background: '#e8607a' }} />}
        </div>
        <span style={{ fontSize: 12, color: checked ? '#eeeef0' : '#6b7280', lineHeight: 1.5, transition: 'color 0.15s', userSelect: 'none' }}>
          {checkLabel}
        </span>
      </label>
    </div>
  )
}

export default function LegalPage() {
  const router    = useRouter()
  const [checked1, setChecked1] = useState(false)
  const [checked2, setChecked2] = useState(false)
  const [checked3, setChecked3] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const allChecked = checked1 && checked2 && checked3

  async function handleSubmit() {
    if (!allChecked || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res  = await fetch('/api/companions/onboarding/legal', { method: 'POST', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      router.push('/companion/onboarding/submitted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-5 py-12"
      style={{ background: '#07090f' }}>

      {/* Noise */}
      <div className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }} />

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[520px]"
        style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 20, overflow: 'hidden' }}>

        {/* Accent line */}
        <div style={{ height: 3, background: 'linear-gradient(90deg,transparent,#e8607a,transparent)' }} />

        <div className="px-8 pt-7 pb-10">
          {/* Logo + stage */}
          <div className="flex items-center justify-between mb-6">
            <Image src="/logo_light.png" alt="BlushBite" width={70} height={22} style={{ objectFit: 'contain' }} />
            <span style={{ fontSize: 11, color: '#e8607a', background: 'rgba(232,96,122,0.08)', border: '1px solid rgba(232,96,122,0.3)', borderRadius: 999, padding: '3px 10px' }}>
              Step 2 of 3
            </span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 600, color: '#eeeef0', marginBottom: 8, lineHeight: 1.25 }}>
            Before you meet your audience.
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 24 }}>
            Read each agreement. Check the box. These protect you as much as they protect us.
          </p>

          {/* Doc blocks */}
          <DocBlock
            chipColor="gold"
            chipLabel="Terms of Service"
            summaryBullets={[
              'You retain ownership of all content you post',
              'BlushBite earns a listing fee only',
              'You may deactivate your profile at any time',
            ]}
            bodyText={TOS_TEXT}
            checkLabel="I have read and agree to the BlushBite Terms of Service"
            checked={checked1}
            onCheck={setChecked1}
          />

          <DocBlock
            chipColor="gold"
            chipLabel="Model Release & Content Consent"
            summaryBullets={[
              'Non-exclusive licence to display your content on BlushBite',
              'You confirm you hold rights to all content posted',
              'Removal requests honoured within 30 days',
            ]}
            bodyText={MODEL_RELEASE_TEXT}
            checkLabel="I confirm I am the sole creator of any content I post and consent to its display on BlushBite"
            checked={checked2}
            onCheck={setChecked2}
          />

          <DocBlock
            chipColor="rose"
            chipLabel="Age & Performer Declaration"
            summaryBullets={[]}
            bodyText={undefined}
            checkLabel="I confirm all individuals depicted in my content are 18 or older"
            checked={checked3}
            onCheck={setChecked3}
          />

          {/* Age block custom para */}
          <div style={{ marginTop: -8, marginBottom: 12, padding: '0 0 0 0' }}>
            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginBottom: 0 }}>
              By checking this box, you confirm you are 18 years of age or older, and that any individuals depicted in content you post have confirmed the same to you in writing.
            </p>
          </div>

          {error && <p style={{ fontSize: 12, color: '#e8607a', marginBottom: 12 }}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!allChecked || submitting}
            style={{
              width: '100%', height: 52, background: '#e8607a', color: '#fff', border: 'none',
              borderRadius: 10, fontSize: 13.5, fontWeight: 500, cursor: allChecked && !submitting ? 'pointer' : 'not-allowed',
              opacity: !allChecked || submitting ? 0.45 : 1, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8, transition: 'opacity 0.2s',
            }}>
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Sign & submit my profile for review →
          </button>
        </div>
      </motion.div>
    </div>
  )
}
