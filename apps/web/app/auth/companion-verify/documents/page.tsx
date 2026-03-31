'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw } from 'lucide-react'
import type { VerificationResult } from '@didit-protocol/sdk-web'

// DiditVerify must NOT be SSR'd — SDK references browser globals at import time
const DiditVerify = dynamic(() => import('@/components/DiditVerify'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

type UIState =
  | 'checking'    // initial status check on mount
  | 'starting'    // fetching session from API
  | 'running'     // Didit modal is open
  | 'submitted'   // user completed the flow, waiting for webhook
  | 'approved'    // webhook confirmed — stage advanced
  | 'declined'    // Didit declined
  | 'cancelled'   // user closed the modal
  | 'error'       // API / SDK failure

// ─── Constants ────────────────────────────────────────────────────────────────

const PROGRESS_PERCENT = (3 / 7) * 100

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompanionDocumentsPage() {
  const router = useRouter()

  const [uiState,          setUiState]          = useState<UIState>('checking')
  const [verificationUrl,  setVerificationUrl]  = useState<string | null>(null)
  const [errorMessage,     setErrorMessage]     = useState('')

  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollCountRef = useRef(0)
  const [pollExpired, setPollExpired] = useState(false)

  // ─── On mount: check existing status, then start if needed ───────────────
  useEffect(() => {
    async function init() {
      try {
        const res  = await fetch('/api/companion/verification/status')
        const json = await res.json()

        if (json.status === 'approved') {
          setUiState('approved')
          return
        }
        if (json.status === 'pending') {
          setUiState('submitted')
          return
        }
      } catch {
        // status check failed — proceed to start fresh
      }

      // No prior approval/pending — fetch a new session and start SDK
      await startSession()
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Fetch session and set verification URL ───────────────────────────────
  async function startSession() {
    setUiState('starting')
    setErrorMessage('')
    try {
      const res  = await fetch('/api/companion/verification/start', { method: 'POST' })
      const json = await res.json()

      if (!res.ok) {
        setErrorMessage(json.error ?? 'Something went wrong. Try again in a moment.')
        setUiState('error')
        return
      }

      setVerificationUrl(json.verification_url)
      setUiState('running')
    } catch {
      setErrorMessage('Could not reach the verification service. Check your connection.')
      setUiState('error')
    }
  }

  // ─── Handle Didit SDK onComplete ──────────────────────────────────────────
  function handleComplete(result: VerificationResult) {
    if (result.type === 'completed') {
      // Didit has the submission — show "under review" and poll for webhook
      if (result.session?.status === 'Declined') {
        setUiState('declined')
      } else {
        setUiState('submitted')
      }
    } else if (result.type === 'cancelled') {
      setUiState('cancelled')
    } else {
      // failed
      setErrorMessage(`Verification could not be completed (${result.error?.type ?? 'unknown'}). Please try again.`)
      setUiState('error')
    }
  }

  // ─── Poll every 3 s while submitted — capped at 60 iterations (3 min) ────
  useEffect(() => {
    if (uiState !== 'submitted') return

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
        if      (json.status === 'approved') setUiState('approved')
        else if (json.status === 'declined') setUiState('declined')
      } catch { /* silently retry */ }
    }, 3000)

    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [uiState])

  // ─── Manual status refresh (shown after poll expires) ────────────────────
  async function checkStatus() {
    setPollExpired(false)
    try {
      const res  = await fetch('/api/companion/verification/status')
      const json = await res.json()
      if      (json.status === 'approved') setUiState('approved')
      else if (json.status === 'declined') setUiState('declined')
      else setPollExpired(true)
    } catch {
      setPollExpired(true)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#07090f] flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">

      {/* Didit SDK — renders null, SDK owns its own modal */}
      {uiState === 'running' && verificationUrl && (
        <DiditVerify
          verificationUrl={verificationUrl}
          onComplete={handleComplete}
        />
      )}

      {/* Noise texture */}
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)' }}
      />

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
          <Image src="/logo_light.png" alt="BlushBite" width={120} height={48} style={{ objectFit: 'contain' }} priority />
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full bg-[#0d1117] border border-[#1c2333] rounded-[20px] overflow-hidden"
        >
          {/* Top accent line */}
          <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #e8607a, transparent)' }} />

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
                  <div key={i} className="rounded-full transition-all duration-300" style={{
                    width: i === 3 ? 18 : 6, height: 6,
                    background: i <= 3 ? '#e8607a' : '#1c2333',
                  }} />
                ))}
              </div>
            </div>

            {/* State-driven content */}
            <AnimatePresence mode="wait">

              {/* CHECKING / STARTING — loading spinner */}
              {(uiState === 'checking' || uiState === 'starting') && (
                <motion.div key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center py-10 gap-3"
                >
                  <Loader2 size={24} className="animate-spin text-[#e8607a]" />
                  <p className="text-[12px] text-[#6b7280]">
                    {uiState === 'checking' ? 'Checking your status…' : 'Opening secure verification…'}
                  </p>
                </motion.div>
              )}

              {/* RUNNING — SDK modal is active, show a subtle waiting message */}
              {uiState === 'running' && (
                <motion.div key="running"
                  variants={cardVariants} initial="hidden" animate="show"
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.3 } }}
                  className="text-center py-6"
                >
                  <Loader2 size={22} className="animate-spin text-[#e8607a] mx-auto mb-4" />
                  <h2 className="text-[22px] text-[#eeeef0] leading-tight mb-2"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    Verification{' '}
                    <em style={{ fontStyle: 'italic', color: '#e8607a' }}>in progress.</em>
                  </h2>
                  <p className="text-[12px] text-[#6b7280] leading-[1.6]">
                    Complete the steps in the verification window that just opened.
                  </p>
                </motion.div>
              )}

              {/* SUBMITTED — waiting for webhook */}
              {uiState === 'submitted' && (
                <motion.div key="submitted"
                  variants={cardVariants} initial="hidden" animate="show"
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.3 } }}
                  className="text-center py-4"
                >
                  <div className="flex justify-center mb-7">
                    <div className="relative w-[56px] h-[56px] flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full" style={{
                        background: 'rgba(232,96,122,0.12)',
                        border: '1px solid rgba(232,96,122,0.3)',
                        animation: 'pulse-ring 2s ease-in-out infinite',
                      }} />
                      <div className="w-[32px] h-[32px] rounded-full"
                        style={{ background: 'linear-gradient(135deg, #c4485e, #e8607a)' }} />
                    </div>
                  </div>
                  <h2 className="text-[24px] text-[#eeeef0] leading-tight mb-3"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    We&apos;re reviewing{' '}
                    <em style={{ fontStyle: 'italic', color: '#e8607a' }}>your identity.</em>
                  </h2>
                  <p className="text-[13px] text-[#6b7280] mb-7 leading-[1.65] max-w-[340px] mx-auto">
                    This usually takes a moment. You can close this tab — we&apos;ll hold your place.
                  </p>
                  {pollExpired ? (
                    <button onClick={checkStatus}
                      className="inline-flex items-center gap-2 text-[12px] text-[#e8607a] px-4 py-2 rounded-full cursor-pointer transition-all duration-200 hover:opacity-80"
                      style={{ background: 'rgba(232,96,122,0.08)', border: '1px solid rgba(232,96,122,0.25)' }}
                    >
                      <RefreshCw size={12} /> Check my status
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 text-[12px] text-[#6b7280] px-4 py-2 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1c2333' }}>
                      <Loader2 size={12} className="animate-spin text-[#e8607a]" />
                      Checking automatically…
                    </div>
                  )}
                </motion.div>
              )}

              {/* APPROVED */}
              {uiState === 'approved' && (
                <motion.div key="approved"
                  variants={cardVariants} initial="hidden" animate="show"
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.3 } }}
                  className="text-center py-4"
                >
                  <div className="flex justify-center mb-7">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="w-[56px] h-[56px] rounded-full flex items-center justify-center text-white text-[22px]"
                      style={{ background: 'linear-gradient(135deg, #c4485e, #e8607a)', boxShadow: '0 0 32px rgba(232,96,122,0.35)' }}
                    >✓</motion.div>
                  </div>
                  <h2 className="text-[24px] text-[#eeeef0] leading-tight mb-3"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    Identity{' '}
                    <em style={{ fontStyle: 'italic', color: '#e8607a' }}>confirmed.</em>
                  </h2>
                  <p className="text-[13px] text-[#6b7280] mb-7 leading-[1.65]">
                    Welcome to BlushBite&apos;s verified circle.
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full py-[12px] rounded-[10px] text-[13.5px] font-medium text-white transition-all duration-200 flex items-center justify-center"
                    style={{ background: '#e8607a', border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(232,96,122,0.22)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none' }}
                  >
                    Enter your world →
                  </button>
                </motion.div>
              )}

              {/* DECLINED */}
              {uiState === 'declined' && (
                <motion.div key="declined"
                  variants={cardVariants} initial="hidden" animate="show"
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.3 } }}
                  className="text-center py-4"
                >
                  <div className="flex justify-center mb-7">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="w-[56px] h-[56px] rounded-full flex items-center justify-center text-[#6b7280] text-[20px]"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1c2333' }}
                    >✕</motion.div>
                  </div>
                  <h2 className="text-[24px] text-[#eeeef0] leading-tight mb-3"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    We couldn&apos;t verify{' '}
                    <em style={{ fontStyle: 'italic', color: '#e8607a' }}>your identity.</em>
                  </h2>
                  <p className="text-[13px] text-[#6b7280] mb-6 leading-[1.65] max-w-[340px] mx-auto">
                    This can happen if lighting was poor or the ID was obscured. You&apos;re welcome to try again.
                  </p>
                  <button onClick={startSession}
                    className="w-full py-[12px] rounded-[10px] text-[13.5px] font-medium text-white transition-all duration-200 flex items-center justify-center"
                    style={{ background: '#e8607a', border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(232,96,122,0.22)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none' }}
                  >
                    Try again →
                  </button>
                </motion.div>
              )}

              {/* CANCELLED */}
              {uiState === 'cancelled' && (
                <motion.div key="cancelled"
                  variants={cardVariants} initial="hidden" animate="show"
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.3 } }}
                  className="text-center py-4"
                >
                  <h2 className="text-[24px] text-[#eeeef0] leading-tight mb-3"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    Paused for{' '}
                    <em style={{ fontStyle: 'italic', color: '#e8607a' }}>now.</em>
                  </h2>
                  <p className="text-[13px] text-[#6b7280] mb-7 leading-[1.65]">
                    Your progress is saved. Continue whenever you&apos;re ready.
                  </p>
                  <button onClick={startSession}
                    className="w-full py-[12px] rounded-[10px] text-[13.5px] font-medium text-white transition-all duration-200 flex items-center justify-center"
                    style={{ background: '#e8607a', border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(232,96,122,0.22)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none' }}
                  >
                    Continue verification →
                  </button>
                </motion.div>
              )}

              {/* ERROR */}
              {uiState === 'error' && (
                <motion.div key="error"
                  variants={cardVariants} initial="hidden" animate="show"
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.3 } }}
                  className="text-center py-4"
                >
                  <h2 className="text-[24px] text-[#eeeef0] leading-tight mb-3"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    Something{' '}
                    <em style={{ fontStyle: 'italic', color: '#e8607a' }}>went wrong.</em>
                  </h2>
                  {errorMessage && (
                    <div className="px-3 py-2 rounded-[8px] text-[12px] text-[#e8607a] text-center mb-5"
                      style={{ background: 'rgba(232,96,122,0.08)', border: '1px solid rgba(232,96,122,0.25)' }}>
                      {errorMessage}
                    </div>
                  )}
                  <button onClick={startSession}
                    className="w-full py-[12px] rounded-[10px] text-[13.5px] font-medium text-white transition-all duration-200 flex items-center justify-center"
                    style={{ background: '#e8607a', border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(232,96,122,0.22)' }}
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

        <p className="text-[11px] text-[#6b7280] mt-5 text-center" style={{ opacity: 0.6 }}>
          Your identity is verified by Didit and never shown publicly.
        </p>
      </motion.div>

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.18); opacity: 0.55; }
        }
      `}</style>
    </div>
  )
}
