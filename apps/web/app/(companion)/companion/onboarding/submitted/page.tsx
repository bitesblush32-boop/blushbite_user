'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

interface StatusData {
  is_live:      boolean
  submitted_at: string | null
  email:        string | null
}

export default function SubmittedPage() {
  const router = useRouter()
  const [status, setStatus] = useState<StatusData | null>(null)

  async function fetchStatus() {
    try {
      const res  = await fetch('/api/companions/onboarding/submit/status', { credentials: 'include' })
      const data = await res.json()
      if (data.is_live) {
        router.push('/companion/dashboard')
        return
      }
      setStatus({ is_live: data.is_live, submitted_at: data.submitted_at, email: data.email ?? null })
    } catch {}
  }

  useEffect(() => {
    fetchStatus()
    const id = setInterval(fetchStatus, 30_000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const submittedAt = status?.submitted_at
    ? new Date(status.submitted_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null

  return (
    <div className="relative min-h-screen flex items-center justify-center px-5 py-12"
      style={{ background: '#07090f' }}>

      {/* Noise */}
      <div className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }} />

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)' }} />

      {/* Pulse keyframe */}
      <style>{`@keyframes bbPulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[480px]"
        style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 20, overflow: 'hidden' }}>

        {/* Accent line */}
        <div style={{ height: 3, background: 'linear-gradient(90deg,transparent,#e8607a,transparent)' }} />

        <div className="px-8 pt-7 pb-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image src="/logo_light.png" alt="BlushBite" width={80} height={26} style={{ objectFit: 'contain' }} />
          </div>

          {/* Gold chip */}
          <div className="flex justify-center mb-5">
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#c9a96e', letterSpacing: '0.04em',
              background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.3)',
              borderRadius: 999, padding: '4px 12px',
            }}>
              ✦ Under Review
            </span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: '#eeeef0', textAlign: 'center', lineHeight: 1.25, marginBottom: 12 }}>
            Your profile is in our hands now.
          </h1>

          {/* Subtext */}
          <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 1.75, marginBottom: 0 }}>
            Our team reviews every companion personally. This usually takes 24–48 hours.
            {status?.email && (
              <> We'll be in touch at <span style={{ color: '#eeeef0' }}>{status.email}</span>.</>
            )}
          </p>

          {/* Step tracker */}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Step 1 — complete */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                <CheckCircle2 size={18} color="#34d399" />
              </div>
              <div>
                <p style={{ fontSize: 13, color: '#34d399', fontWeight: 500, margin: 0 }}>Profile submitted</p>
                {submittedAt && (
                  <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0', lineHeight: 1.4 }}>{submittedAt}</p>
                )}
              </div>
            </div>

            {/* Step 2 — in progress */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ flexShrink: 0, marginTop: 4 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', background: '#c9a96e',
                  animation: 'bbPulse 1.2s ease-in-out infinite',
                }} />
              </div>
              <div>
                <p style={{ fontSize: 13, color: '#c9a96e', fontWeight: 500, margin: 0 }}>Under review</p>
                <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>Usually 24–48 hours</p>
              </div>
            </div>

            {/* Step 3 — future */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ flexShrink: 0, marginTop: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1c2333' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>You're live</p>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div style={{ height: 1, background: '#1c2333', margin: '24px 0' }} />

          {/* Explore link */}
          <button
            type="button"
            onClick={() => router.push('/')}
            style={{ display: 'block', width: '100%', textAlign: 'center', fontSize: 13, color: '#e8607a', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            Explore the platform while you wait →
          </button>
        </div>
      </motion.div>
    </div>
  )
}
