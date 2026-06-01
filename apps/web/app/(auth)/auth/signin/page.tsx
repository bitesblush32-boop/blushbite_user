'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'

// ─── Schemas ────────────────────────────────────────────────────────────────

const signInSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const registerSchema = z.object({
  email:           z.string().email('Enter a valid email address'),
  password:        z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignInInputs    = z.infer<typeof signInSchema>
type RegisterInputs  = z.infer<typeof registerSchema>

// ─── Password strength ──────────────────────────────────────────────────────

function getStrength(pw: string): number {
  if (pw.length < 6) return 0
  let s = 0
  if (pw.length >= 8)                                        s++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw))                 s++
  if (/[0-9]/.test(pw))                                      s++
  if (/[^a-zA-Z0-9]/.test(pw))                               s++
  return Math.min(s, 4)
}

const STRENGTH_LABEL = ['Too short', 'Weak', 'Fair', 'Strong', 'Very strong']
const STRENGTH_COLOR = ['#6b7280', '#e8607a', '#f59e0b', '#4ade80', '#22c55e']

// ─── Page ────────────────────────────────────────────────────────────────────

function SignInContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl  = searchParams.get('callbackUrl') ?? '/'

  // Surface token-level OAuth errors forwarded via searchParams
  useEffect(() => {
    const err = searchParams.get('error')
    if (err === 'OAuthEmailMissing') {
      setServerError("Twitter didn't share your email. Please use Google or email/password instead.")
    }
  }, [searchParams])

  const [mode, setMode]               = useState<'signin' | 'register'>('signin')
  const [emailOpen, setEmailOpen]     = useState(false)
  const [showPw, setShowPw]           = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading]     = useState<'google' | 'twitter' | 'email' | null>(null)
  const [serverError, setServerError] = useState('')

  // Sign-in form
  const siForm = useForm<SignInInputs>({
    resolver: zodResolver(signInSchema),
  })

  // Register form
  const regForm = useForm<RegisterInputs>({
    resolver: zodResolver(registerSchema),
  })

  const pwValue      = regForm.watch('password') ?? ''
  const pwStrength   = getStrength(pwValue)

  // ─── OAuth handlers ────────────────────────────────────────────────────────

  const handleOAuth = useCallback(async (provider: 'google' | 'twitter') => {
    setIsLoading(provider)
    setServerError('')
    try {
      await signIn(provider, { callbackUrl })
    } catch {
      setServerError('Something went wrong. Please try again.')
      setIsLoading(null)
    }
  }, [callbackUrl])

  // ─── Credentials sign-in ──────────────────────────────────────────────────

  const handleSignIn = siForm.handleSubmit(async ({ email, password }) => {
    setIsLoading('email')
    setServerError('')
    const result = await signIn('credentials', {
      email, password,
      redirect: false,
    })
    if (result?.error) {
      setServerError('Incorrect email or password.')
      setIsLoading(null)
    } else {
      router.push(callbackUrl)
    }
  })

  // ─── Register ─────────────────────────────────────────────────────────────

  const handleRegister = regForm.handleSubmit(async ({ email, password }) => {
    setIsLoading('email')
    setServerError('')
    try {
      const res = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error ?? 'Registration failed. Please try again.')
        setIsLoading(null)
        return
      }
      // Auto sign in after registration
      await signIn('credentials', { email, password, callbackUrl, redirect: true })
    } catch {
      setServerError('Something went wrong. Please try again.')
      setIsLoading(null)
    }
  })

  const toggleMode = () => {
    setMode(m => m === 'signin' ? 'register' : 'signin')
    setServerError('')
    siForm.reset()
    regForm.reset()
  }

  const toggleEmail = () => {
    setEmailOpen(v => !v)
    setServerError('')
  }

  const currentForm   = mode === 'signin' ? siForm : regForm
  const onSubmit      = mode === 'signin' ? handleSignIn : handleRegister

  return (
    <div className="min-h-screen bg-[#07090f] flex overflow-hidden relative">

      {/* ── Ambient glows ───────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 80% at 72% 50%, rgba(232,96,122,0.05) 0%, transparent 70%)' }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600, height: 600,
          top: '-100px', left: '-200px',
          background: 'radial-gradient(circle, rgba(155,95,224,0.04) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* ════════════════════════════════════════════════════════════════════
          LEFT PANEL — literary atmosphere (desktop only)
      ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex flex-col justify-between flex-1 px-16 py-16 relative overflow-hidden"
      >
        {/* Faint silhouette — decorative, behind text */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none select-none" style={{ opacity: 0.04 }}>
          <svg width="280" height="520" viewBox="0 0 70 140" fill="#eeeef0">
            <ellipse cx="35" cy="22" rx="18" ry="21" />
            <path d="M10 72 Q18 44 35 42 Q52 44 60 72 L63 132 Q52 142 35 144 Q18 142 7 132Z" />
          </svg>
        </div>

        {/* Logo */}
        <div>
          <Image
            src="/logo_light.png"
            alt="BlushBite"
            width={140}
            height={56}
            style={{ objectFit: 'contain', objectPosition: 'left center' }}
            priority
          />
        </div>

        {/* Literary copy — the atmosphere */}
        <div className="max-w-[460px]">
          {/* Overline chip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-[6px] text-[11px] font-medium text-[#e8607a] px-[10px] py-1 rounded-full mb-8 tracking-[0.06em] uppercase"
            style={{ background: 'rgba(232,96,122,0.1)', border: '1px solid rgba(232,96,122,0.22)' }}
          >
            <span className="w-[5px] h-[5px] rounded-full bg-current inline-block" />
            Private · Verified · Anonymous
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[52px] leading-[1.1] text-[#eeeef0] mb-5"
          >
            Your desire
            <br />
            <em style={{ fontStyle: 'italic', color: '#e8607a' }}>has a home.</em>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="text-[15px] text-[#6b7280] leading-[1.8] mb-10 max-w-[400px]"
          >
            Companions who understand the parts of you that stay quiet at dinner.
            Stories that read like confessions. Audio for the hour after midnight.
          </motion.p>

          {/* Trust items */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col gap-[10px]"
          >
            {[
              { icon: '🔒', text: 'Anonymous by design — no real names, ever' },
              { icon: '✦',  text: 'Verified & licensed companions only' },
              { icon: '·',  text: 'EU-hosted · Strictly 18+ · GDPR compliant' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-[10px] text-[12px] text-[#6b7280]">
                <span className="text-[#c9a96e] text-[13px] w-4 text-center">{icon}</span>
                {text}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom copyright */}
        <p className="text-[11px] text-[#6b7280]" style={{ opacity: 0.5 }}>
          © 2025 BlushBite · All companions verified · 18+
        </p>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════
          RIGHT PANEL — auth card
      ════════════════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-[520px] flex items-center justify-center p-6 lg:p-12 relative">

        {/* Rose glow behind card */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 400, height: 400,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(232,96,122,0.07) 0%, transparent 70%)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="w-full max-w-[420px] relative"
        >
          {/* ── Auth card ─────────────────────────────────────────────── */}
          <div
            className="rounded-[20px] border border-[#1c2333] overflow-hidden"
            style={{ background: '#0d1117' }}
          >
            {/* Top accent line */}
            <div
              className="h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent, #e8607a, transparent)' }}
            />

            <div className="p-8 lg:p-10">

              {/* Mobile: logo */}
              <div className="flex justify-center mb-7 lg:hidden">
                <Image
                  src="/logo_light.png"
                  alt="BlushBite"
                  width={120}
                  height={48}
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>

              {/* ── Mode heading ──────────────────────────────────────── */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="mb-7"
                >
                  <p className="text-[11px] text-[#6b7280] uppercase tracking-[0.08em] mb-2">
                    {mode === 'signin' ? 'Welcome back' : 'Join the platform'}
                  </p>
                  <h2
                    className="text-[24px] text-[#eeeef0] leading-tight"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {mode === 'signin'
                      ? <>Sign in to your <em style={{ fontStyle: 'italic', color: '#e8607a' }}>private world</em></>
                      : <>Create your <em style={{ fontStyle: 'italic', color: '#e8607a' }}>account</em></>}
                  </h2>
                </motion.div>
              </AnimatePresence>

              {/* ── OAuth buttons ─────────────────────────────────────── */}
              <motion.div
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.07 } },
                }}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-[10px] mb-4"
              >
                {/* Google */}
                <motion.button
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
                  }}
                  onClick={() => handleOAuth('google')}
                  disabled={!!isLoading}
                  className="w-full flex items-center justify-center gap-3 rounded-[10px] py-[13px] px-5 text-[13.5px] font-medium text-[#eeeef0] transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: '#161d2a',
                    border: '1px solid #1c2333',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#1c2333')}
                >
                  {isLoading === 'google' ? (
                    <Loader2 size={17} className="animate-spin text-[#6b7280]" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continue with Google
                </motion.button>

                {/* X / Twitter */}
                <motion.button
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
                  }}
                  onClick={() => handleOAuth('twitter')}
                  disabled={!!isLoading}
                  className="w-full flex items-center justify-center gap-3 rounded-[10px] py-[13px] px-5 text-[13.5px] font-medium text-[#eeeef0] transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: '#161d2a',
                    border: '1px solid #1c2333',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#1c2333')}
                >
                  {isLoading === 'twitter' ? (
                    <Loader2 size={17} className="animate-spin text-[#6b7280]" />
                  ) : (
                    <XIcon />
                  )}
                  Continue with X / Twitter
                </motion.button>
              </motion.div>

              {/* ── Or divider ────────────────────────────────────────── */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-[#1c2333]" />
                <span className="text-[11px] text-[#6b7280] tracking-[0.04em]">or</span>
                <div className="flex-1 h-px bg-[#1c2333]" />
              </div>

              {/* ── Email toggle button ───────────────────────────────── */}
              <motion.button
                onClick={toggleEmail}
                disabled={!!isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-between rounded-[10px] py-[13px] px-5 text-[13.5px] font-medium transition-all duration-200 cursor-pointer disabled:opacity-60"
                style={{
                  background: emailOpen ? 'rgba(232,96,122,0.08)' : '#161d2a',
                  border: emailOpen ? '1px solid rgba(232,96,122,0.35)' : '1px solid #1c2333',
                  color: emailOpen ? '#e8607a' : '#eeeef0',
                }}
              >
                <span className="flex items-center gap-3">
                  <MailIcon active={emailOpen} />
                  Continue with email
                </span>
                <motion.span
                  animate={{ rotate: emailOpen ? 90 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <ArrowRight size={15} style={{ color: emailOpen ? '#e8607a' : '#6b7280' }} />
                </motion.span>
              </motion.button>

              {/* ── Credentials form (slides open) ───────────────────── */}
              <AnimatePresence initial={false}>
                {emailOpen && (
                  <motion.div
                    key="email-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="pt-5">
                      <AnimatePresence mode="wait">
                        <motion.form
                          key={mode + '-form'}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -12 }}
                          transition={{ duration: 0.25 }}
                          onSubmit={onSubmit}
                          className="flex flex-col gap-3"
                        >
                          {/* Email input */}
                          <div>
                            <input
                              type="email"
                              placeholder="your@email.com"
                              autoComplete="email"
                              inputMode="email"
                              {...(mode === 'signin' ? siForm.register('email') : regForm.register('email'))}
                              className="w-full rounded-[10px] py-[13px] px-4 text-[16px] text-[#eeeef0] placeholder:text-[#6b7280] outline-none transition-all duration-200"
                              style={{
                                background: '#161d2a',
                                border: '1px solid #1c2333',
                              }}
                              onFocus={e => { e.currentTarget.style.borderColor = '#e8607a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,96,122,0.1)' }}
                              onBlur={e  => { e.currentTarget.style.borderColor = '#1c2333'; e.currentTarget.style.boxShadow = 'none' }}
                            />
                            {mode === 'signin' && siForm.formState.errors.email && (
                              <p className="text-[11px] text-[#e8607a] mt-1 ml-1">{siForm.formState.errors.email.message}</p>
                            )}
                            {mode === 'register' && regForm.formState.errors.email && (
                              <p className="text-[11px] text-[#e8607a] mt-1 ml-1">{regForm.formState.errors.email.message}</p>
                            )}
                          </div>

                          {/* Password input */}
                          <div>
                            <div className="relative">
                              <input
                                type={showPw ? 'text' : 'password'}
                                placeholder="Password"
                                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                                {...(mode === 'signin' ? siForm.register('password') : regForm.register('password'))}
                                className="w-full rounded-[10px] py-[13px] pl-4 pr-11 text-[16px] text-[#eeeef0] placeholder:text-[#6b7280] outline-none transition-all duration-200"
                                style={{
                                  background: '#161d2a',
                                  border: '1px solid #1c2333',
                                }}
                                onFocus={e => { e.currentTarget.style.borderColor = '#e8607a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,96,122,0.1)' }}
                                onBlur={e  => { e.currentTarget.style.borderColor = '#1c2333'; e.currentTarget.style.boxShadow = 'none' }}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPw(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#eeeef0] transition-colors"
                              >
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                            {mode === 'signin' && siForm.formState.errors.password && (
                              <p className="text-[11px] text-[#e8607a] mt-1 ml-1">{siForm.formState.errors.password.message}</p>
                            )}
                            {mode === 'register' && regForm.formState.errors.password && (
                              <p className="text-[11px] text-[#e8607a] mt-1 ml-1">{regForm.formState.errors.password.message}</p>
                            )}
                          </div>

                          {/* ── Register-only fields ───────────────────── */}
                          <AnimatePresence initial={false}>
                            {mode === 'register' && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                style={{ overflow: 'hidden' }}
                                className="flex flex-col gap-3"
                              >
                                {/* Confirm password */}
                                <div className="relative">
                                  <input
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Confirm password"
                                    autoComplete="new-password"
                                    {...regForm.register('confirmPassword')}
                                    className="w-full rounded-[10px] py-[13px] pl-4 pr-11 text-[16px] text-[#eeeef0] placeholder:text-[#6b7280] outline-none transition-all duration-200"
                                    style={{
                                      background: '#161d2a',
                                      border: '1px solid #1c2333',
                                    }}
                                    onFocus={e => { e.currentTarget.style.borderColor = '#e8607a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,96,122,0.1)' }}
                                    onBlur={e  => { e.currentTarget.style.borderColor = '#1c2333'; e.currentTarget.style.boxShadow = 'none' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirm(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#eeeef0] transition-colors"
                                  >
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>
                                </div>
                                {regForm.formState.errors.confirmPassword && (
                                  <p className="text-[11px] text-[#e8607a] -mt-2 ml-1">{regForm.formState.errors.confirmPassword.message}</p>
                                )}

                                {/* Password strength indicator */}
                                {pwValue.length > 0 && (
                                  <div>
                                    <div className="flex gap-[5px] mb-[6px]">
                                      {[1, 2, 3, 4].map(i => (
                                        <div
                                          key={i}
                                          className="flex-1 h-[3px] rounded-full transition-all duration-300"
                                          style={{
                                            background: i <= pwStrength ? STRENGTH_COLOR[pwStrength] : '#1c2333',
                                          }}
                                        />
                                      ))}
                                    </div>
                                    <p
                                      className="text-[11px] transition-colors duration-300"
                                      style={{ color: STRENGTH_COLOR[pwStrength] }}
                                    >
                                      {STRENGTH_LABEL[pwStrength]}
                                    </p>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Server error */}
                          <AnimatePresence>
                            {serverError && (
                              <motion.p
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-[12px] text-[#e8607a] text-center py-[10px] px-4 rounded-[8px]"
                                style={{ background: 'rgba(232,96,122,0.08)', border: '1px solid rgba(232,96,122,0.2)' }}
                              >
                                {serverError}
                              </motion.p>
                            )}
                          </AnimatePresence>

                          {/* Submit CTA */}
                          <motion.button
                            type="submit"
                            disabled={isLoading === 'email'}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full flex items-center justify-center gap-2 rounded-[10px] py-[14px] text-[13.5px] font-medium text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                            style={{
                              background: isLoading === 'email' ? '#c4485e' : '#e8607a',
                              boxShadow: isLoading === 'email' ? 'none' : '0 4px 20px rgba(232,96,122,0.25)',
                            }}
                            onMouseEnter={e => { if (isLoading !== 'email') e.currentTarget.style.background = '#c4485e' }}
                            onMouseLeave={e => { if (isLoading !== 'email') e.currentTarget.style.background = '#e8607a' }}
                          >
                            {isLoading === 'email' ? (
                              <><Loader2 size={16} className="animate-spin" /> {mode === 'signin' ? 'Signing in…' : 'Creating account…'}</>
                            ) : (
                              mode === 'signin' ? 'Sign in' : 'Create account'
                            )}
                          </motion.button>

                          {/* Forgot password (sign in only) */}
                          {mode === 'signin' && (
                            <button
                              type="button"
                              className="text-[12px] text-[#6b7280] hover:text-[#e8607a] transition-colors text-right mt-1 cursor-pointer"
                            >
                              Forgot password?
                            </button>
                          )}
                        </motion.form>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Mode toggle ───────────────────────────────────────── */}
              <div className="mt-6 text-center">
                <span className="text-[12.5px] text-[#6b7280]">
                  {mode === 'signin' ? 'First time here? ' : 'Already a member? '}
                </span>
                <button
                  onClick={toggleMode}
                  className="text-[12.5px] text-[#e8607a] hover:text-[#c4485e] transition-colors cursor-pointer font-medium"
                >
                  {mode === 'signin' ? 'Create your account →' : 'Sign in →'}
                </button>
              </div>

            </div>
          </div>

          {/* Privacy note below card */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-center text-[11px] text-[#6b7280] mt-5 px-4 leading-[1.6]"
            style={{ opacity: 0.6 }}
          >
            By continuing you confirm you are 18 or older and agree to our{' '}
            <Link href="/terms" className="text-[#e8607a] hover:underline">Terms</Link> and{' '}
            <Link href="/privacy" className="text-[#e8607a] hover:underline">Privacy Policy</Link>.
            Your identity stays private — always.
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  )
}

// ─── Icon components ─────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#eeeef0">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function MailIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? '#e8607a' : '#6b7280'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 7L2 7" />
    </svg>
  )
}
