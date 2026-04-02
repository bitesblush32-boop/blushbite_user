'use client'

// Companion onboarding — Step 1: Legal identity
// Route: /companion/onboarding/identity
// Previous location: /auth/companion-verify

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function max18YearsAgo(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return d.toISOString().split('T')[0]
}

function isAtLeast18(dob: string): boolean {
  const date = new Date(dob)
  if (isNaN(date.getTime())) return false
  const today = new Date()
  const age18 = new Date(date.getFullYear() + 18, date.getMonth(), date.getDate())
  return today >= age18
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
  fullName: z.string()
    .min(2, 'Your name must be at least 2 characters.')
    .max(100, 'That name is a little long.'),
  dateOfBirth: z.string()
    .refine(v => !isNaN(new Date(v).getTime()), 'Enter a valid date.')
    .refine(isAtLeast18, 'You must be 18 or older to continue.'),
  country: z.string().min(1, 'Select a country to continue.'),
})

type FormInputs = z.infer<typeof schema>

// ─── Countries ───────────────────────────────────────────────────────────────

const COUNTRIES = [
  'Netherlands', 'Germany', 'France', 'United Kingdom', 'United States',
  'Belgium', 'Spain', 'Italy', 'Portugal', 'Austria', 'Switzerland', 'Denmark',
  'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Greece',
  'Croatia', 'Serbia', 'Brazil', 'Mexico', 'Argentina', 'Colombia', 'Australia',
  'New Zealand', 'Japan', 'South Korea', 'United Arab Emirates',
  'South Africa', 'India', 'Thailand', 'Philippines', 'Malaysia', 'Indonesia',
  'Hong Kong', 'Taiwan', 'Turkey', 'Israel', 'Morocco', 'Egypt', 'Other',
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CompanionIdentityPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (data) => {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/companions/onboarding/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName:    data.fullName,
          dateOfBirth: data.dateOfBirth,
          country:     data.country,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setSaveError(json.error ?? 'Something went wrong. Try again in a moment.')
        setSaving(false)
        return
      }
      router.push('/companion/onboarding/verify')
    } catch {
      setSaveError('Something went wrong. Try again in a moment.')
      setSaving(false)
    }
  })

  const maxDate = max18YearsAgo()
  const progressPercent = useMemo(() => 50, []) // step 1 of 2

  return (
    <div className="min-h-screen bg-[#07090f] flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">

      {/* Noise texture */}
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient rose glow */}
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
              Companion Profile · Step 1 of 2
            </p>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="relative h-[2px] w-full rounded-full bg-[#1c2333] mb-3 overflow-hidden">
                <motion.div
                  className="absolute left-0 top-0 h-full rounded-full"
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: 'linear-gradient(90deg, #c4485e, #e8607a)' }}
                />
              </div>
              <div className="flex items-center justify-end gap-[6px]">
                {[1, 2].map(i => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === 1 ? 18 : 6,
                      height: 6,
                      background: i === 1 ? '#e8607a' : '#1c2333',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Heading */}
            <h2
              className="text-[24px] text-[#eeeef0] leading-tight mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Tell us who you are.
            </h2>

            <p
              className="text-[18px] text-[#e8607a] mb-3"
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
            >
              This stays between us — always.
            </p>

            <p className="text-[13px] text-[#6b7280] mb-7 leading-[1.65]">
              Used only for identity verification. Never shown on your profile.
            </p>

            {/* Form */}
            <form onSubmit={onSubmit} className="flex flex-col gap-5">

              {/* Field 1 — Full name */}
              <div>
                <label className="block text-[10px] text-[#6b7280] uppercase tracking-[0.08em] mb-[6px]">
                  your legal name
                </label>
                <input
                  type="text"
                  placeholder="As it appears on your ID"
                  autoComplete="name"
                  {...register('fullName')}
                  className="w-full bg-[#161d2a] border border-[#1c2333] rounded-[10px] py-[13px] px-4 text-[13.5px] text-[#eeeef0] placeholder:text-[#6b7280] outline-none transition-all duration-200"
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#e8607a'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,96,122,0.1)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = '#1c2333'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                {errors.fullName && (
                  <p className="text-[11px] text-[#e8607a] mt-1 ml-1">{errors.fullName.message}</p>
                )}
              </div>

              {/* Field 2 — Date of birth */}
              <div>
                <label className="block text-[10px] text-[#6b7280] uppercase tracking-[0.08em] mb-[6px]">
                  date of birth
                </label>
                <input
                  type="date"
                  max={maxDate}
                  {...register('dateOfBirth')}
                  className="w-full bg-[#161d2a] border border-[#1c2333] rounded-[10px] py-[13px] px-4 text-[13.5px] text-[#eeeef0] outline-none transition-all duration-200"
                  style={{ colorScheme: 'dark' }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#e8607a'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,96,122,0.1)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = '#1c2333'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <p className="text-[11px] text-[#6b7280] mt-1">
                  You must be 18 or older to continue.
                </p>
                {errors.dateOfBirth && (
                  <p className="text-[11px] text-[#e8607a] mt-[2px] ml-1">{errors.dateOfBirth.message}</p>
                )}
              </div>

              {/* Field 3 — Country */}
              <div>
                <label className="block text-[10px] text-[#6b7280] uppercase tracking-[0.08em] mb-[6px]">
                  country of residence
                </label>
                <div className="relative">
                  <select
                    {...register('country')}
                    className="w-full bg-[#161d2a] border border-[#1c2333] rounded-[10px] py-[13px] px-4 text-[13.5px] text-[#eeeef0] outline-none transition-all duration-200 cursor-pointer appearance-none pr-9"
                    style={{ colorScheme: 'dark' }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#e8607a'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,96,122,0.1)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#1c2333'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <option value="" disabled>Select your country</option>
                    {COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] text-[11px]">
                    ▾
                  </div>
                </div>
                {errors.country && (
                  <p className="text-[11px] text-[#e8607a] mt-1 ml-1">{errors.country.message}</p>
                )}
              </div>

              {/* Server error */}
              {saveError && (
                <div
                  className="px-3 py-2 rounded-[8px] text-[12px] text-[#e8607a] text-center"
                  style={{
                    background: 'rgba(232,96,122,0.08)',
                    border: '1px solid rgba(232,96,122,0.25)',
                  }}
                >
                  {saveError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-[12px] rounded-[10px] text-[13.5px] font-medium transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background: saving ? '#161d2a' : '#e8607a',
                  color: saving ? '#6b7280' : '#fff',
                  border: saving ? '1px solid #1c2333' : 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: saving ? 'none' : '0 6px 20px rgba(232,96,122,0.22)',
                }}
                onMouseEnter={e => {
                  if (!saving) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'none'
                }}
              >
                {saving ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving…</>
                ) : (
                  'Save & continue →'
                )}
              </button>

            </form>
          </div>
        </motion.div>

        <p
          className="text-[11px] text-[#6b7280] mt-5 text-center"
          style={{ opacity: 0.6 }}
        >
          This information is for verification only and never shown publicly.
        </p>
      </motion.div>
    </div>
  )
}
