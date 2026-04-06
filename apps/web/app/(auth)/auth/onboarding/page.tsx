'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────────────────────

const VIBES = [
  'Curious', 'Romantic', 'Dominant', 'Submissive', 'Experimental',
  'Soft & Gentle', 'Mischievous', 'Strict', 'Wild', 'Elegant',
  'Sensual', 'Bratty', 'Intense', 'Flirty', 'Mysterious',
  'Nurturing', 'Cerebral', 'Radiant', 'Demanding', 'Spontaneous',
]

const ALL_GENDERS = [
  'Female', 'Male', 'Trans Female', 'Trans Male', 'Non-Binary',
  'Genderfluid', 'Genderqueer', 'Agender', 'Bigender', 'Androgynous',
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface OnboardingData {
  vibes: string[]
  gender: string
  desiredGenders: string[]
  role: 'dream' | 'dreamer' | ''
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StepVibes({
  data,
  toggleVibe,
}: {
  data: OnboardingData
  toggleVibe: (v: string) => void
}) {
  const maxReached = data.vibes.length >= 10

  return (
    <div>
      <p className="text-[10px] text-[#e8607a] uppercase tracking-[0.1em] mb-3">
        Question 1 of 4
      </p>
      <h2
        className="text-[24px] text-[#eeeef0] mb-2 leading-tight"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        The chemistry is up to you.
      </h2>
      <p
        className="text-[20px] text-[#e8607a] mb-3"
        style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
      >
        Which vibe calls to you tonight?
      </p>
      <p className="text-[13px] text-[#6b7280] mb-6 leading-[1.65]">
        Pick up to 10. These become the pulse of your feed.
      </p>

      <div className="flex justify-between items-center mb-4">
        <span className="text-[11px] text-[#6b7280]">{data.vibes.length} / 10 selected</span>
        {maxReached && (
          <span
            className="text-[10px] px-2 py-[2px] rounded-full"
            style={{
              background: 'rgba(232,96,122,0.1)',
              border: '1px solid rgba(232,96,122,0.2)',
              color: '#e8607a',
            }}
          >
            Max reached
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-[8px]">
        {VIBES.map(vibe => {
          const selected = data.vibes.includes(vibe)
          const disabled = maxReached && !selected
          return (
            <motion.button
              key={vibe}
              onClick={() => !disabled && toggleVibe(vibe)}
              whileTap={!disabled ? { scale: 0.95 } : undefined}
              className="text-[12px] px-[14px] py-[7px] rounded-full border transition-all duration-150"
              style={{
                borderColor: selected ? 'rgba(232,96,122,0.45)' : '#1c2333',
                color: selected ? '#e8607a' : '#6b7280',
                background: selected ? 'rgba(232,96,122,0.1)' : 'transparent',
                opacity: disabled ? 0.35 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {vibe}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function StepGender({
  data,
  setData,
}: {
  data: OnboardingData
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>
}) {
  return (
    <div>
      <p className="text-[10px] text-[#e8607a] uppercase tracking-[0.1em] mb-3">
        Question 2 of 4
      </p>
      <h2
        className="text-[24px] text-[#eeeef0] mb-2 leading-tight"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Tell us who&apos;s stepping into the dark.
      </h2>
      <p
        className="text-[20px] text-[#e8607a] mb-3"
        style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
      >
        How do you want to be known here?
      </p>
      <p className="text-[13px] text-[#6b7280] mb-6 leading-[1.65]">
        This shapes your identity on the platform. One answer only.
      </p>

      <div className="grid grid-cols-2 gap-[8px]">
        {ALL_GENDERS.map(gender => {
          const selected = data.gender === gender
          return (
            <button
              key={gender}
              onClick={() => setData(d => ({ ...d, gender }))}
              className="text-[13px] py-[10px] px-4 rounded-[10px] text-left border transition-all flex justify-between items-center"
              style={{
                borderColor: selected ? 'rgba(232,96,122,0.45)' : '#1c2333',
                background: selected ? 'rgba(232,96,122,0.1)' : '#161d2a',
                color: selected ? '#e8607a' : '#6b7280',
                cursor: 'pointer',
              }}
            >
              <span>{gender}</span>
              <AnimatePresence>
                {selected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.15 }}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0 ml-2"
                    style={{ background: '#e8607a' }}
                  >
                    ✓
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepDesiredGenders({
  data,
  setData,
  toggleDesiredGender,
}: {
  data: OnboardingData
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>
  toggleDesiredGender: (g: string) => void
}) {
  return (
    <div>
      <p className="text-[10px] text-[#e8607a] uppercase tracking-[0.1em] mb-3">
        Question 3 of 4
      </p>
      <h2
        className="text-[24px] text-[#eeeef0] mb-2 leading-tight"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Which gender holds the key
      </h2>
      <p
        className="text-[20px] text-[#e8607a] mb-3"
        style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
      >
        to your desire?
      </p>
      <p className="text-[13px] text-[#6b7280] mb-6 leading-[1.65]">
        Select everyone who draws you in. More than one is perfectly fine.
      </p>

      <div className="grid grid-cols-2 gap-[8px]">
        {ALL_GENDERS.map(gender => {
          const selected = data.desiredGenders.includes(gender)
          return (
            <button
              key={gender}
              onClick={() => toggleDesiredGender(gender)}
              className="text-[13px] py-[10px] px-4 rounded-[10px] text-left border transition-all flex justify-between items-center"
              style={{
                borderColor: selected ? 'rgba(232,96,122,0.45)' : '#1c2333',
                background: selected ? 'rgba(232,96,122,0.1)' : '#161d2a',
                color: selected ? '#e8607a' : '#6b7280',
                cursor: 'pointer',
              }}
            >
              <span>{gender}</span>
              <AnimatePresence>
                {selected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.15 }}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0 ml-2"
                    style={{ background: '#e8607a' }}
                  >
                    ✓
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </div>

      <p
        onClick={() => setData(d => ({ ...d, desiredGenders: [...ALL_GENDERS] }))}
        className="text-[12px] text-[#6b7280] cursor-pointer mt-3 text-center hover:text-[#eeeef0] transition-colors"
        style={{ textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}
      >
        I&apos;m open to everyone
      </p>
    </div>
  )
}

function StepRole({
  data,
  setData,
}: {
  data: OnboardingData
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>
}) {
  return (
    <div>
      <p className="text-[10px] text-[#e8607a] uppercase tracking-[0.1em] mb-3">
        Question 4 of 4
      </p>
      <h2
        className="text-[24px] text-[#eeeef0] mb-2 leading-tight"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Are you the dream,
      </h2>
      <p
        className="text-[20px] text-[#e8607a] mb-3"
        style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
      >
        or the dreamer?
      </p>
      <p className="text-[13px] text-[#6b7280] mb-8 leading-[1.65]">
        This unlocks your world on BlushBite. No right answer — only yours.
      </p>

      <div className="flex flex-col gap-4">
        {/* Card A — The Dream */}
        <button
          onClick={() => setData(d => ({ ...d, role: 'dream' }))}
          className="text-left rounded-[14px] p-6 cursor-pointer transition-all duration-200 relative"
          style={{
            background: data.role === 'dream' ? 'rgba(232,96,122,0.08)' : '#161d2a',
            border: data.role === 'dream'
              ? '1px solid rgba(232,96,122,0.5)'
              : '1px solid #1c2333',
            boxShadow: data.role === 'dream' ? '0 0 0 1px rgba(232,96,122,0.2)' : 'none',
          }}
          onMouseEnter={e => {
            if (data.role !== 'dream') {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(232,96,122,0.3)'
            }
          }}
          onMouseLeave={e => {
            if (data.role !== 'dream') {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#1c2333'
            }
          }}
        >
          <AnimatePresence>
            {data.role === 'dream' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-white text-[12px]"
                style={{ background: '#e8607a' }}
              >
                ✓
              </motion.div>
            )}
          </AnimatePresence>

          <span
            className="text-[10px] px-[10px] py-1 rounded-full"
            style={{
              background: 'rgba(232,96,122,0.1)',
              border: '1px solid rgba(232,96,122,0.3)',
              color: '#e8607a',
            }}
          >
            Companion
          </span>
          <div
            className="text-[22px] text-[#eeeef0] mt-2 mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            The Dream
          </div>
          <p className="text-[13px] text-[#6b7280] leading-[1.6] italic">
            You set the scene. You are what they came for.
            Your desires shape the experience — on your terms, always.
          </p>
        </button>

        {/* Card B — The Dreamer */}
        <button
          onClick={() => setData(d => ({ ...d, role: 'dreamer' }))}
          className="text-left rounded-[14px] p-6 cursor-pointer transition-all duration-200 relative"
          style={{
            background: data.role === 'dreamer' ? 'rgba(201,169,110,0.06)' : '#161d2a',
            border: data.role === 'dreamer'
              ? '1px solid rgba(201,169,110,0.45)'
              : '1px solid #1c2333',
          }}
          onMouseEnter={e => {
            if (data.role !== 'dreamer') {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,169,110,0.3)'
            }
          }}
          onMouseLeave={e => {
            if (data.role !== 'dreamer') {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#1c2333'
            }
          }}
        >
          <AnimatePresence>
            {data.role === 'dreamer' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-white text-[12px]"
                style={{ background: '#c9a96e' }}
              >
                ✓
              </motion.div>
            )}
          </AnimatePresence>

          <span className="text-[10px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280]">
            Explorer
          </span>
          <div
            className="text-[22px] text-[#eeeef0] mt-2 mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            The Dreamer
          </div>
          <p className="text-[13px] text-[#6b7280] leading-[1.6] italic">
            Every explorer needs a destination.
            Yours is somewhere warm, private, and exactly what you&apos;ve been imagining.
          </p>
        </button>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const { update } = useSession()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [data, setData] = useState<OnboardingData>({
    vibes: [],
    gender: '',
    desiredGenders: [],
    role: '',
  })

  const toggleVibe = useCallback((vibe: string) => {
    setData(d => {
      if (d.vibes.includes(vibe)) return { ...d, vibes: d.vibes.filter(v => v !== vibe) }
      if (d.vibes.length >= 10) return d
      return { ...d, vibes: [...d.vibes, vibe] }
    })
  }, [])

  const toggleDesiredGender = useCallback((gender: string) => {
    setData(d => {
      if (d.desiredGenders.includes(gender)) {
        return { ...d, desiredGenders: d.desiredGenders.filter(g => g !== gender) }
      }
      return { ...d, desiredGenders: [...d.desiredGenders, gender] }
    })
  }, [])

  const canContinue =
    step === 1 ? data.vibes.length >= 1
    : step === 2 ? data.gender !== ''
    : step === 3 ? data.desiredGenders.length >= 1
    : data.role !== ''

  const handleContinue = async () => {
    if (step < 4) {
      setStep(s => s + 1)
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vibes:          data.vibes,
          gender:         data.gender,
          desiredGenders: data.desiredGenders,
          role:           data.role,
        }),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error ?? 'Something went wrong.')
      }
      const result = await res.json()
      await update()
      // Companions (dream) go to identity verification — Dreamers go to the feed
      if (result.platform_role === 'dream') {
        router.push('/companion/welcome')
      } else {
        router.push('/')
      }
    } catch (err) {
      setSaving(false)
      setSaveError(err instanceof Error && err.message ? err.message : 'Something went wrong. Try again in a moment.')
    }
  }

  const handleSkip = () => setStep(s => s + 1)

  const progressPercent = (step / 4) * 100

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
        className="w-full max-w-[520px] relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center mb-8"
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
          className="rounded-[20px] border border-[#1c2333] overflow-hidden"
          style={{ background: '#0d1117' }}
        >
          {/* Top accent line */}
          <div
            className="h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, #e8607a, transparent)' }}
          />

          <div className="p-8">

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
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#e8607a] uppercase tracking-[0.1em]">
                  Step {step} of 4
                </span>
                <div className="flex items-center gap-[6px]">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === step ? 18 : 6,
                        height: 6,
                        background: i <= step ? '#e8607a' : '#1c2333',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Step content with slide transition */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {step === 1 && <StepVibes data={data} toggleVibe={toggleVibe} />}
                {step === 2 && <StepGender data={data} setData={setData} />}
                {step === 3 && (
                  <StepDesiredGenders
                    data={data}
                    setData={setData}
                    toggleDesiredGender={toggleDesiredGender}
                  />
                )}
                {step === 4 && <StepRole data={data} setData={setData} />}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="px-5 py-[11px] rounded-[10px] text-[13px] text-[#6b7280] border border-[#1c2333] transition-all flex-shrink-0 hover:border-white/20 hover:text-[#eeeef0]"
                >
                  ← Back
                </button>
              )}

              <button
                onClick={canContinue && !saving ? handleContinue : undefined}
                disabled={!canContinue || saving}
                className="flex-1 py-[12px] rounded-[10px] text-[14px] font-medium transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background: canContinue && !saving ? '#e8607a' : '#161d2a',
                  color: canContinue && !saving ? '#fff' : '#6b7280',
                  border: canContinue && !saving ? 'none' : '1px solid #1c2333',
                  boxShadow: canContinue && !saving ? '0 6px 20px rgba(232,96,122,0.22)' : 'none',
                  cursor: !canContinue || saving ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => {
                  if (canContinue && !saving) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'none'
                }}
              >
                {saving ? (
                  <><Loader2 size={16} className="animate-spin" /> Creating your world…</>
                ) : step === 4 ? (
                  'Enter my world →'
                ) : (
                  'Continue →'
                )}
              </button>
            </div>

            {/* Skip link (steps 2 and 3 only) */}
            {(step === 2 || step === 3) && (
              <p
                onClick={handleSkip}
                className="text-center text-[11.5px] text-[#6b7280] mt-3 cursor-pointer hover:text-[#eeeef0] transition-colors"
              >
                Skip for now — I&apos;ll set this later
              </p>
            )}

            {/* Save error */}
            {saveError && (
              <div
                className="mt-3 px-3 py-2 rounded-[8px] text-[12px] text-[#e8607a] text-center"
                style={{
                  background: 'rgba(232,96,122,0.08)',
                  border: '1px solid rgba(232,96,122,0.25)',
                }}
              >
                {saveError}
              </div>
            )}
          </div>
        </motion.div>

        <p
          className="text-center text-[11px] text-[#6b7280] mt-5"
          style={{ opacity: 0.5 }}
        >
          Your answers stay private — they&apos;re only used to shape your feed.
        </p>
      </motion.div>
    </div>
  )
}
