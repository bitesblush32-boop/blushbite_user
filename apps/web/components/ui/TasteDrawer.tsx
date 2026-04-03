'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Options (mirrors onboarding) ────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TasteData {
  vibes:           string[]
  gender:          string
  desiredGenders:  string[]
}

interface TasteDrawerProps {
  open:         boolean
  onClose:      () => void
  onSaved:      (data: TasteData) => void
  initialFocus?: 'vibes' | 'gender' | 'desires'
  defaults?:    Partial<TasteData>
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TasteDrawer({
  open,
  onClose,
  onSaved,
  initialFocus = 'vibes',
  defaults,
}: TasteDrawerProps) {
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const [vibes, setVibes]                   = useState<string[]>(defaults?.vibes ?? [])
  const [gender, setGender]                 = useState(defaults?.gender ?? '')
  const [desiredGenders, setDesiredGenders] = useState<string[]>(defaults?.desiredGenders ?? [])

  // Sync defaults when drawer opens
  useEffect(() => {
    if (open) {
      setVibes(defaults?.vibes ?? [])
      setGender(defaults?.gender ?? '')
      setDesiredGenders(defaults?.desiredGenders ?? [])
      setError(null)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  function toggleVibe(v: string) {
    setVibes(prev =>
      prev.includes(v)
        ? prev.filter(x => x !== v)
        : prev.length < 10 ? [...prev, v] : prev
    )
  }

  function toggleDesire(g: string) {
    setDesiredGenders(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    )
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/users/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ vibes, gender, desiredGenders }),
      })
      if (!res.ok) {
        const { error: e } = await res.json().catch(() => ({}))
        setError(e ?? 'Something went wrong.')
        return
      }
      onSaved({ vibes, gender, desiredGenders })
      onClose()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const motionProps = isMobile
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, transition: { type: 'spring' as const, stiffness: 380, damping: 38 } }
    : { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, transition: { type: 'spring' as const, stiffness: 380, damping: 38 } }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[850]"
            style={{ background: 'rgba(0,0,0,0.65)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            {...motionProps}
            className="fixed z-[860] overflow-y-auto bottom-0 left-0 right-0 md:bottom-0 md:top-0 md:left-auto md:right-0 md:w-[480px]"
            style={{
              background:   '#0d1117',
              borderTop:    isMobile ? '1px solid #1c2333' : 'none',
              borderLeft:   isMobile ? 'none' : '1px solid #1c2333',
              borderRadius: isMobile ? '20px 20px 0 0' : 0,
              maxHeight:    isMobile ? '92vh' : '100vh',
              willChange:   'transform',
            }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[#1c2333]"
              style={{ background: '#0d1117' }}
            >
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#eeeef0' }}>
                Your taste
              </span>
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid #1c2333',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6b7280', fontSize: 16, transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,96,122,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-6 flex flex-col gap-8">

              {/* ── Vibes ─────────────────────────────────────────── */}
              <div id="taste-vibes">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">Vibes</label>
                  <span style={{ fontSize: 11, color: vibes.length >= 10 ? '#e8607a' : '#4b5563' }}>
                    {vibes.length} / 10
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 12 }}>
                  Pick up to 10 — these shape your feed.
                </p>
                <div className="flex flex-wrap gap-2">
                  {VIBES.map(v => {
                    const on  = vibes.includes(v)
                    const dim = vibes.length >= 10 && !on
                    return (
                      <motion.button
                        key={v}
                        type="button"
                        whileTap={!dim ? { scale: 0.93 } : undefined}
                        onClick={() => !dim && toggleVibe(v)}
                        className="text-[12px] px-[13px] py-[6px] rounded-full border transition-all duration-150"
                        style={{
                          borderColor: on ? 'rgba(232,96,122,0.45)' : '#1c2333',
                          color:       on ? '#e8607a' : '#6b7280',
                          background:  on ? 'rgba(232,96,122,0.1)' : 'transparent',
                          opacity:     dim ? 0.3 : 1,
                          cursor:      dim ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {v}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* ── Gender identity ────────────────────────────────── */}
              <div id="taste-gender">
                <label className="text-[11px] text-[#6b7280] uppercase tracking-widest block mb-1">
                  Your gender
                </label>
                <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 12 }}>
                  How you want to be known here.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_GENDERS.map(g => {
                    const on = gender === g
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(on ? '' : g)}
                        className="text-[13px] py-[10px] px-4 rounded-[10px] text-left border transition-all flex justify-between items-center"
                        style={{
                          borderColor: on ? 'rgba(232,96,122,0.45)' : '#1c2333',
                          background:  on ? 'rgba(232,96,122,0.1)' : '#161d2a',
                          color:       on ? '#e8607a' : '#6b7280',
                          cursor: 'pointer',
                        }}
                      >
                        <span>{g}</span>
                        <AnimatePresence>
                          {on && (
                            <motion.span
                              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
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

              {/* ── Desired genders ────────────────────────────────── */}
              <div id="taste-desires">
                <label className="text-[11px] text-[#6b7280] uppercase tracking-widest block mb-1">
                  Desires
                </label>
                <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 12 }}>
                  Who draws you in — select everyone who does.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_GENDERS.map(g => {
                    const on = desiredGenders.includes(g)
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleDesire(g)}
                        className="text-[13px] py-[10px] px-4 rounded-[10px] text-left border transition-all flex justify-between items-center"
                        style={{
                          borderColor: on ? 'rgba(232,96,122,0.45)' : '#1c2333',
                          background:  on ? 'rgba(232,96,122,0.1)' : '#161d2a',
                          color:       on ? '#e8607a' : '#6b7280',
                          cursor: 'pointer',
                        }}
                      >
                        <span>{g}</span>
                        <AnimatePresence>
                          {on && (
                            <motion.span
                              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
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
                <button
                  type="button"
                  onClick={() => setDesiredGenders([...ALL_GENDERS])}
                  className="text-[12px] text-[#6b7280] cursor-pointer mt-3 w-full text-center hover:text-[#eeeef0] transition-colors bg-transparent border-none"
                  style={{ textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}
                >
                  I'm open to everyone
                </button>
              </div>

              {/* ── Error / Save ───────────────────────────────────── */}
              {error && (
                <p style={{ fontSize: 12, color: '#e87070', textAlign: 'center' }}>{error}</p>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 rounded-[10px] py-[12px] text-[13.5px] font-medium text-white transition-all duration-200"
                style={{
                  background:    saving ? '#c4485e' : '#e8607a',
                  border:        'none',
                  opacity:       saving ? 0.8 : 1,
                  pointerEvents: saving ? 'none' : 'auto',
                  cursor:        saving ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = '#c4485e' }}
                onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = '#e8607a' }}
              >
                {saving ? (
                  <>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff',
                      animation: 'spin 0.7s linear infinite', display: 'inline-block', flexShrink: 0,
                    }} />
                    Saving…
                  </>
                ) : 'Save my taste'}
              </button>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
