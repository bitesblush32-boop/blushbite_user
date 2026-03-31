'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw } from 'lucide-react'

// DiditVerify must NOT be SSR'd — attaches window event listeners (browser-only)
const DiditVerify = dynamic(() => import('@/components/DiditVerify'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

type UIState = 'loading' | 'idle' | 'pending' | 'approved' | 'declined'

// ─── Constants ────────────────────────────────────────────────────────────────

const PROGRESS_PERCENT = (3 / 7) * 100

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompanionDocumentsPage() {
  const router = useRouter()

  const [uiState,      setUiState]      = useState<UIState>('loading')
  const [starting,     setStarting]     = useState(false)
  const [startError,   setStartError]   = useState('')
  const [sessionId,        setSessionId]        = useState<string | null>(null)
  const [sessionToken,     setSessionToken]     = useState<string | undefined>(undefined)
  const [verificationUrl,  setVerificationUrl]  = useState<string | null>(null)
  const [showDidit,        setShowDidit]        = useState(false)

  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollCountRef = useRef(0)
  const [pollExpired, setPollExpired] = useState(false)

  // ─── Fetch initial status on mount ──────────────────────────────────────────
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res  = await fetch('/api/companion/verification/status')
        const json = await res.json()
        setUiState((json.status as UIState) ?? 'idle')
      } catch {
        setUiState('idle')
      }
    }
    fetchStatus()
  }, [])

  // ─── Poll every 3 s while status is pending — capped at 60 iterations (3 min) ─
  useEffect(() => {
    if (uiState !== 'pending') return

    pollCountRef.current = 0
    setPollExpired(false)

    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1

      if (pollCountRef.current >= 60) {
        clearInterval(pollRef.current!)
        pollRef.current = null
        setPollExpired(true)
        return
      }

      try {
        const res  = await fetch('/api/companion/verification/status')
        const json = await res.json()
        const next: UIState = json.status ?? 'pending'
        if (next !== 'pending') setUiState(next)
      } catch {
        // silently continue — next tick will retry
      }
    }, 3000)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [uiState])

  // ─── Manual status check (shown after poll expires) ──────────────────────────
  async function fetchStatus() {
    setPollExpired(false)
    try {
      const res  = await fetch('/api/companion/verification/status')
      const json = await res.json()
      const next: UIState = json.status ?? 'pending'
      setUiState(next)
    } catch {
      setPollExpired(true)
    }
  }

  // ─── Begin verification ───────────────────────────────────────────────────
  async function handleBegin() {
    setStarting(true)
    setStartError('')

    try {
      const res  = await fetch('/api/companion/verification/start', { method: 'POST' })
      const json = await res.json()

      if (!res.ok) {
        setStartError(json.error ?? 'Something slipped — try again in a moment.')
        setStarting(false)
        return
      }

      const { session_id, session_token, verification_url } = json
      setSessionId(session_id)
      setSessionToken(session_token)
      setVerificationUrl(verification_url)
      setShowDidit(true)
    } catch {
      setStartError('Something slipped — try again in a moment.')
      setStarting(false)
    }
  }

  // ─── DiditVerify callbacks ────────────────────────────────────────────────
  function handleDiditSuccess(_session: unknown) {
    setShowDidit(false)
    setStarting(false)
    setUiState('pending')
  }

  function handleDiditCancel() {
    setShowDidit(false)
    setStarting(false)
  }

  function handleDiditError(code: string) {
    setShowDidit(false)
    setStarting(false)
    setStartError(`Verification error (${code}). Please try again.`)
  }

  // ─── Retry after decline ──────────────────────────────────────────────────
  function handleRetry() {
    setUiState('idle')
    setStartError('')
    setSessionId(null)
    setSessionToken(undefined)
    setVerificationUrl(null)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#07090f] flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">

      {/* Didit SDK modal — SDK owns its own UI, renders null here */}
      {showDidit && verificationUrl && (
        <DiditVerify
          sessionToken={sessionToken ?? ''}
          verificationUrl={verificationUrl}
          onSuccess={handleDiditSuccess}
          onCancel={handleDiditCancel}
          onError={handleDiditError}
        />
      )}

      {/* Noise texture — fixed, z-[1000], GPU composited */}
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient rose glow — scrolls with content */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Page entrance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[480px] relative z-10 flex flex-col items-center"
      >

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <Image
            src="/logo_light.png"
            alt="BlushBite"
            width={120}
            height={48}
            style={{ objectFit: 'contain' }}
            priority
          />
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full bg-[#0d1117] border border-[#1c2333] rounded-[20px] overflow-hidden"
        >
          {/* Top accent line */}
          <div
            className="h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, #e8607a, transparent)' }}
          />

          <div className="p-8">

            {/* Stage indicator */}
            <p className="text-[10px] text-[#e8607a] uppercase tracking-[0.1em] mb-4">
              Companion Profile · Stage 3 of 7
            </p>

            {/* Progress bar */}
            <div className="mb-7">
              <div className="relative h-[2px] w-full rounded-full bg-[#1c2333] mb-3 overflow-hidden">
                <motion.div
                  className="absolute left-0 top-0 h-full rounded-full"
                  animate={{ width: `${PROGRESS_PERCENT}%` }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: 'linear-gradient(90deg, #c4485e, #e8607a)' }}
                />
              </div>
              <div className="flex items-center justify-end gap-[6px]">
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width:      i === 3 ? 18 : 6,
                      height:     6,
                      background: i <= 3 ? '#e8607a' : '#1c2333',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ── State-driven content ─────────────────────────────────────── */}
            <AnimatePresence mode="wait">

              {/* LOADING */}
              {uiState === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center py-10 gap-3"
                >
                  <Loader2 size={24} className="animate-spin text-[#e8607a]" />
                  <p className="text-[12px] text-[#6b7280]">Checking your status…</p>
                </motion.div>
              )}

              {/* IDLE */}
              {uiState === 'idle' && (
                <motion.div
                  key="idle"
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.3 } }}
                >
                  <h2
                    className="text-[24px] text-[#eeeef0] leading-tight mb-3"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Let's confirm{' '}
                    <em style={{ fontStyle: 'italic', color: '#e8607a' }}>who you are.</em>
                  </h2>

                  <p className="text-[13px] text-[#6b7280] mb-7 leading-[1.65]">
                    This takes about 2 minutes. You'll need your government-issued ID and a moment alone.
                  </p>

                  {/* What you'll need */}
                  <div
                    className="rounded-[12px] border border-[#1c2333] p-5 mb-7"
                    style={{ background: '#111620' }}
                  >
                    <p className="text-[10px] text-[#6b7280] uppercase tracking-[0.08em] mb-4 font-medium">
                      what you'll need
                    </p>
                    <div className="flex flex-col gap-[14px]">
                      {[
                        { icon: '🪪', label: 'Passport or national ID',  sub: 'Any government-issued photo ID' },
                        { icon: '💡', label: 'Good lighting',            sub: 'Natural light works best'       },
                        { icon: '📷', label: 'Front-facing camera',      sub: 'A liveness check will follow'  },
                      ].map(item => (
                        <div key={item.label} className="flex items-start gap-3">
                          <span className="text-[16px] flex-shrink-0 mt-[2px]">{item.icon}</span>
                          <div>
                            <p className="text-[13px] text-[#eeeef0] font-medium">{item.label}</p>
                            <p className="text-[11.5px] text-[#6b7280] mt-[2px]">{item.sub}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Server error */}
                  {startError && (
                    <div
                      className="px-3 py-2 rounded-[8px] text-[12px] text-[#e8607a] text-center mb-4"
                      style={{
                        background: 'rgba(232,96,122,0.08)',
                        border:     '1px solid rgba(232,96,122,0.25)',
                      }}
                    >
                      {startError}
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    onClick={handleBegin}
                    disabled={starting}
                    className="w-full py-[12px] rounded-[10px] text-[13.5px] font-medium transition-all duration-200 flex items-center justify-center gap-2"
                    style={{
                      background: starting ? '#161d2a' : '#e8607a',
                      color:      starting ? '#6b7280' : '#fff',
                      border:     starting ? '1px solid #1c2333' : 'none',
                      cursor:     starting ? 'not-allowed' : 'pointer',
                      boxShadow:  starting ? 'none' : '0 6px 20px rgba(232,96,122,0.22)',
                    }}
                    onMouseEnter={e => { if (!starting) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none' }}
                  >
                    {starting ? (
                      <><Loader2 size={15} className="animate-spin" /> Opening verification…</>
                    ) : (
                      'Begin verification →'
                    )}
                  </button>

                  {/* Trust line */}
                  <div className="flex justify-center gap-5 mt-5 flex-wrap">
                    <span className="flex items-center gap-[6px] text-[11.5px] text-[#6b7280]">
                      <span className="text-[#c9a96e]">🔒</span>Your data stays private
                    </span>
                    <span className="flex items-center gap-[6px] text-[11.5px] text-[#6b7280]">
                      <span className="text-[#c9a96e]">✦</span>Powered by Didit
                    </span>
                  </div>
                </motion.div>
              )}

              {/* PENDING */}
              {uiState === 'pending' && (
                <motion.div
                  key="pending"
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.3 } }}
                  className="text-center py-4"
                >
                  {/* Pulsing rose-gold ring — CSS animation, zero JS cost */}
                  <div className="flex justify-center mb-7">
                    <div className="relative w-[56px] h-[56px] flex items-center justify-center">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background:  'rgba(232,96,122,0.12)',
                          border:      '1px solid rgba(232,96,122,0.3)',
                          animation:   'pulse-ring 2s ease-in-out infinite',
                        }}
                      />
                      <div
                        className="w-[32px] h-[32px] rounded-full"
                        style={{ background: 'linear-gradient(135deg, #c4485e, #e8607a)' }}
                      />
                    </div>
                  </div>

                  <h2
                    className="text-[24px] text-[#eeeef0] leading-tight mb-3"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    We're reviewing{' '}
                    <em style={{ fontStyle: 'italic', color: '#e8607a' }}>your identity.</em>
                  </h2>

                  <p className="text-[13px] text-[#6b7280] mb-7 leading-[1.65] max-w-[340px] mx-auto">
                    This usually takes a moment. You can close this tab — we'll hold your place.
                  </p>

                  {pollExpired ? (
                    <button
                      onClick={fetchStatus}
                      className="inline-flex items-center gap-2 text-[12px] text-[#e8607a] px-4 py-2 rounded-full cursor-pointer transition-all duration-200 hover:opacity-80"
                      style={{ background: 'rgba(232,96,122,0.08)', border: '1px solid rgba(232,96,122,0.25)' }}
                    >
                      <RefreshCw size={12} />
                      Check my status
                    </button>
                  ) : (
                    <div
                      className="inline-flex items-center gap-2 text-[12px] text-[#6b7280] px-4 py-2 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1c2333' }}
                    >
                      <Loader2 size={12} className="animate-spin text-[#e8607a]" />
                      Checking automatically every few seconds…
                    </div>
                  )}
                </motion.div>
              )}

              {/* APPROVED */}
              {uiState === 'approved' && (
                <motion.div
                  key="approved"
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.3 } }}
                  className="text-center py-4"
                >
                  {/* Animated checkmark — GPU composited scale transform */}
                  <div className="flex justify-center mb-7">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="w-[56px] h-[56px] rounded-full flex items-center justify-center text-white text-[22px]"
                      style={{
                        background:  'linear-gradient(135deg, #c4485e, #e8607a)',
                        boxShadow:   '0 0 32px rgba(232,96,122,0.35)',
                      }}
                    >
                      ✓
                    </motion.div>
                  </div>

                  <h2
                    className="text-[24px] text-[#eeeef0] leading-tight mb-3"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Identity{' '}
                    <em style={{ fontStyle: 'italic', color: '#e8607a' }}>confirmed.</em>
                  </h2>

                  <p className="text-[13px] text-[#6b7280] mb-7 leading-[1.65]">
                    Welcome to BlushBite's verified circle.
                  </p>

                  <button
                    onClick={() => router.push('/auth/companion-verify/legal')}
                    className="w-full py-[12px] rounded-[10px] text-[13.5px] font-medium text-white transition-all duration-200 flex items-center justify-center"
                    style={{
                      background: '#e8607a',
                      border:     'none',
                      cursor:     'pointer',
                      boxShadow:  '0 6px 20px rgba(232,96,122,0.22)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none' }}
                  >
                    Continue →
                  </button>
                </motion.div>
              )}

              {/* DECLINED */}
              {uiState === 'declined' && (
                <motion.div
                  key="declined"
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.3 } }}
                  className="text-center py-4"
                >
                  {/* Muted x mark */}
                  <div className="flex justify-center mb-7">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="w-[56px] h-[56px] rounded-full flex items-center justify-center text-[#6b7280] text-[20px]"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border:     '1px solid #1c2333',
                      }}
                    >
                      ✕
                    </motion.div>
                  </div>

                  <h2
                    className="text-[24px] text-[#eeeef0] leading-tight mb-3"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    We couldn't verify{' '}
                    <em style={{ fontStyle: 'italic', color: '#e8607a' }}>your identity.</em>
                  </h2>

                  <p className="text-[13px] text-[#6b7280] mb-6 leading-[1.65] max-w-[340px] mx-auto">
                    This can happen if lighting was poor or the ID was obscured. You're welcome to try again.
                  </p>

                  {startError && (
                    <div
                      className="px-3 py-2 rounded-[8px] text-[12px] text-[#e8607a] text-center mb-4"
                      style={{
                        background: 'rgba(232,96,122,0.08)',
                        border:     '1px solid rgba(232,96,122,0.25)',
                      }}
                    >
                      {startError}
                    </div>
                  )}

                  <button
                    onClick={handleRetry}
                    className="w-full py-[12px] rounded-[10px] text-[13.5px] font-medium text-white transition-all duration-200 flex items-center justify-center"
                    style={{
                      background: '#e8607a',
                      border:     'none',
                      cursor:     'pointer',
                      boxShadow:  '0 6px 20px rgba(232,96,122,0.22)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none' }}
                  >
                    Try again →
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>

        {/* Privacy note */}
        <p
          className="text-[11px] text-[#6b7280] mt-5 text-center"
          style={{ opacity: 0.6 }}
        >
          Your identity is verified by Didit and never shown publicly.
        </p>
      </motion.div>

      {/* Pulse-ring keyframe — CSS animation, compositor thread, zero JS cost */}
      <style>{`
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.18); opacity: 0.55; }
        }
      `}</style>
    </div>
  )
}
