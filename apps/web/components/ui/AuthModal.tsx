'use client'

import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ArrowLeft, Loader2 } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

type Step = 'email' | 'otp' | 'setup'

const OVERLAY = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}
const CARD = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 420, damping: 30 },
  },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.14 } },
}

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, setDreamer } = useUIStore()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [alias, setAlias] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const otpRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const aliasRef = useRef<HTMLInputElement>(null)

  // Reset on open
  useEffect(() => {
    if (authModalOpen) {
      setStep('email')
      setEmail('')
      setOtp('')
      setAlias('')
      setPhone('')
      setError('')
      setLoading(false)
      setResendCooldown(0)
      setTimeout(() => emailRef.current?.focus(), 120)
    }
  }, [authModalOpen])

  // Resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  // Focus OTP input when step changes to otp
  useEffect(() => {
    if (step === 'otp') setTimeout(() => otpRef.current?.focus(), 120)
    if (step === 'setup') setTimeout(() => aliasRef.current?.focus(), 120)
  }, [step])

  async function sendOtp(targetEmail = email) {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/users/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not send code.')
        return
      }
      setStep('otp')
      setResendCooldown(60)
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/users/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok || !data.verified) {
        setError(data.error ?? 'Invalid code.')
        return
      }

      if (data.isNew) {
        setStep('setup')
      } else {
        // Returning user — fetch session and close
        await refreshSession()
        closeAuthModal()
      }
    } finally {
      setLoading(false)
    }
  }

  async function completeSetup() {
    if (!alias.trim() || alias.trim().length < 2) {
      setError('Username must be at least 2 characters.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/users/auth/complete-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias: alias.trim(), phone: phone.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not save. Try again.')
        return
      }
      await refreshSession()
      closeAuthModal()
    } finally {
      setLoading(false)
    }
  }

  async function refreshSession() {
    try {
      const res = await fetch('/api/users/me')
      const data = await res.json()
      if (data.user) {
        setDreamer({ id: data.user.id, email: data.user.email, alias: data.user.alias ?? null })
      }
    } catch {
      /* silent */
    }
  }

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    sendOtp(email.trim().toLowerCase())
  }

  function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < 6) return
    verifyOtp()
  }

  function handleSetupSubmit(e: React.FormEvent) {
    e.preventDefault()
    completeSetup()
  }

  if (!authModalOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        key="auth-overlay"
        variants={OVERLAY}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={closeAuthModal}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7,9,15,0.85)',
          zIndex: 9500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
        }}
      >
        <motion.div
          key="auth-card"
          variants={CARD}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#0d1117',
            border: '1px solid #1c2333',
            borderRadius: 20,
            padding: '32px 28px',
            width: '100%',
            maxWidth: 420,
            position: 'relative',
          }}
        >
          {/* Top accent line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              borderRadius: '20px 20px 0 0',
              background: 'linear-gradient(90deg,transparent,#e8607a,transparent)',
            }}
          />

          {/* Close */}
          <button
            onClick={closeAuthModal}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#4b5563',
              padding: 4,
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Back (otp/setup) */}
          {(step === 'otp' || step === 'setup') && (
            <button
              onClick={() => {
                setStep(step === 'setup' ? 'otp' : 'email')
                setError('')
              }}
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#4b5563',
                padding: 4,
              }}
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          {/* Step dots */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 24 }}>
            {(['email', 'otp', 'setup'] as Step[]).map((s) => (
              <div
                key={s}
                style={{
                  height: 4,
                  width: s === step ? 22 : 6,
                  borderRadius: 99,
                  background: s === step ? '#e8607a' : '#1c2333',
                  transition: 'width .2s ease, background .2s',
                }}
              />
            ))}
          </div>

          {/* ── EMAIL STEP ── */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit}>
              <p
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#6b7280',
                  marginBottom: 8,
                }}
              >
                Sign in
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 24,
                  color: '#eeeef0',
                  lineHeight: 1.3,
                  marginBottom: 6,
                }}
              >
                Enter your <em style={{ fontStyle: 'italic', color: '#e8607a' }}>email.</em>
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
                We&apos;ll send you a one-time code. No password needed.
              </p>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                inputMode="email"
                autoComplete="email"
                required
                style={{
                  width: '100%',
                  background: '#111620',
                  border: `1px solid ${error ? 'rgba(248,113,113,0.4)' : '#1c2333'}`,
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: 15,
                  color: '#eeeef0',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: error ? 8 : 20,
                }}
              />
              {error && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 16 }}>{error}</p>}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                style={{
                  width: '100%',
                  background: loading || !email.trim() ? '#1c2333' : '#e8607a',
                  color: loading || !email.trim() ? '#4b5563' : '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '13px 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background .15s',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Sending…
                  </>
                ) : (
                  'Send code →'
                )}
              </button>
            </form>
          )}

          {/* ── OTP STEP ── */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit}>
              <p
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#6b7280',
                  marginBottom: 8,
                }}
              >
                Verify
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 24,
                  color: '#eeeef0',
                  lineHeight: 1.3,
                  marginBottom: 6,
                }}
              >
                Check your <em style={{ fontStyle: 'italic', color: '#e8607a' }}>inbox.</em>
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
                We sent a 6-digit code to <strong style={{ color: '#9ca3af' }}>{email}</strong>
              </p>
              <input
                ref={otpRef}
                type="text"
                value={otp}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setOtp(v)
                  setError('')
                  if (v.length === 6) {
                    // auto-submit on 6 digits
                    setTimeout(() => {
                      setOtp(v)
                    }, 0)
                  }
                }}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                style={{
                  width: '100%',
                  background: '#111620',
                  border: `1px solid ${error ? 'rgba(248,113,113,0.4)' : '#1c2333'}`,
                  borderRadius: 10,
                  padding: '14px 14px',
                  fontSize: 28,
                  fontFamily: 'monospace',
                  letterSpacing: '0.3em',
                  color: '#eeeef0',
                  outline: 'none',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  marginBottom: error ? 8 : 20,
                }}
              />
              {error && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 16 }}>{error}</p>}
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                style={{
                  width: '100%',
                  background: loading || otp.length < 6 ? '#1c2333' : '#e8607a',
                  color: loading || otp.length < 6 ? '#4b5563' : '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '13px 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: loading || otp.length < 6 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background .15s',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Verifying…
                  </>
                ) : (
                  'Verify →'
                )}
              </button>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                {resendCooldown > 0 ? (
                  <span style={{ fontSize: 12, color: '#4b5563' }}>
                    Resend in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => sendOtp()}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      color: '#6b7280',
                      textDecoration: 'underline',
                    }}
                  >
                    Resend code
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ── SETUP STEP ── */}
          {step === 'setup' && (
            <form onSubmit={handleSetupSubmit}>
              <p
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#6b7280',
                  marginBottom: 8,
                }}
              >
                Almost there
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 24,
                  color: '#eeeef0',
                  lineHeight: 1.3,
                  marginBottom: 6,
                }}
              >
                Set up your <em style={{ fontStyle: 'italic', color: '#e8607a' }}>profile.</em>
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
                Pick a username so companions can recognise you.
              </p>

              <label
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Username <span style={{ color: '#e8607a' }}>*</span>
              </label>
              <div style={{ position: 'relative', marginBottom: 4 }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#4b5563',
                    fontSize: 14,
                  }}
                >
                  @
                </span>
                <input
                  ref={aliasRef}
                  type="text"
                  value={alias}
                  onChange={(e) => {
                    setAlias(e.target.value.replace(/\s/g, ''))
                    setError('')
                  }}
                  placeholder="yourname"
                  maxLength={50}
                  required
                  style={{
                    width: '100%',
                    background: '#111620',
                    border: `1px solid ${error ? 'rgba(248,113,113,0.4)' : '#1c2333'}`,
                    borderRadius: 10,
                    padding: '12px 14px 12px 28px',
                    fontSize: 14,
                    color: '#eeeef0',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <p style={{ fontSize: 11, color: '#4b5563', marginBottom: 20 }}>
                This is how you&apos;ll appear to companions.
              </p>

              {error && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 16 }}>{error}</p>}

              <label
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Phone number <span style={{ color: '#4b5563' }}>(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+31 6 12345678"
                inputMode="tel"
                autoComplete="tel"
                style={{
                  width: '100%',
                  background: '#111620',
                  border: '1px solid #1c2333',
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: 14,
                  color: '#eeeef0',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: 4,
                }}
              />
              <p style={{ fontSize: 11, color: '#4b5563', marginBottom: 24 }}>
                Used only for important updates, never shown publicly.
              </p>

              <button
                type="submit"
                disabled={loading || alias.trim().length < 2}
                style={{
                  width: '100%',
                  background: loading || alias.trim().length < 2 ? '#1c2333' : '#e8607a',
                  color: loading || alias.trim().length < 2 ? '#4b5563' : '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '13px 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: loading || alias.trim().length < 2 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background .15s',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Creating…
                  </>
                ) : (
                  'Create my account →'
                )}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
