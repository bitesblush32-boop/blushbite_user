'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight } from 'lucide-react'
import { useSession } from 'next-auth/react'

// ─── Tour step definitions ────────────────────────────────────────────────────

interface TourStep {
  title: string
  body: string
  position: 'center' | 'top' | 'bottom'
  accent?: string
}

const STEPS: TourStep[] = [
  {
    title: 'Welcome to your private world.',
    body: "This is BlushBite — a space designed entirely for your desires. No real names. Just you, your alias, and the companions who know what you're looking for.",
    position: 'center',
    accent: '#e8607a',
  },
  {
    title: 'The feed is your discovery.',
    body: 'Scroll through confessions and stories crafted by companions. Every piece is written for moments like this — quiet, private, entirely yours.',
    position: 'bottom',
  },
  {
    title: 'Navigate between worlds.',
    body: 'Confessions are short, raw, immediate. Stories are longer, richer. Audio brings a voice into the room. Explore by mood, not category.',
    position: 'bottom',
  },
  {
    title: 'Your alias keeps you invisible.',
    body: 'You appear as @adjective-noun — no real name, ever. Your saves, likes, and bookings are private to you. The companions only know what you choose to share.',
    position: 'center',
  },
  {
    title: 'The mini player stays with you.',
    body: 'Start an audio session anywhere — it persists as you browse. Intimate voices, uninterrupted.',
    position: 'top',
  },
  {
    title: 'Your taste shapes everything.',
    body: 'The more you interact, the more attuned the feed becomes. A few likes, a save, a mood — the algorithm learns your desire quietly.',
    position: 'center',
    accent: '#e8607a',
  },
]

// ─── TourOverlay ──────────────────────────────────────────────────────────────

const TOUR_KEY = 'bb_tour_v1_seen'

export function TourOverlay() {
  const { data: session, status } = useSession()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (status !== 'authenticated') return
    // Only show once per browser, for logged-in users
    const seen = localStorage.getItem(TOUR_KEY)
    if (!seen) setVisible(true)
  }, [status])

  const dismiss = () => {
    localStorage.setItem(TOUR_KEY, '1')
    setVisible(false)
  }

  const next = () => {
    if (step >= STEPS.length - 1) {
      dismiss()
      return
    }
    setStep((s) => s + 1)
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const positionStyle: React.CSSProperties =
    current.position === 'top'
      ? { top: 100, bottom: 'auto', transform: 'none' }
      : current.position === 'bottom'
        ? { bottom: 100, top: 'auto', transform: 'none' }
        : { top: '50%', transform: 'translateY(-50%)' }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Dark overlay */}
          <motion.div
            key="tour-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={dismiss}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9000,
              background: 'rgba(7,9,15,0.88)',
              backdropFilter: 'blur(6px)',
              cursor: 'pointer',
            }}
          />

          {/* Tour card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                left: '50%',
                right: 'auto',
                width: 'min(420px, calc(100vw - 32px))',
                marginLeft: 'calc(min(420px, calc(100vw - 32px)) / -2)',
                zIndex: 9001,
                ...positionStyle,
                background: '#0d1117',
                border: '1px solid #1c2333',
                borderRadius: 20,
                overflow: 'hidden',
              }}
            >
              {/* Top accent line */}
              <div
                style={{
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${current.accent ?? '#e8607a'}, transparent)`,
                }}
              />

              <div style={{ padding: '22px 24px 20px' }}>
                {/* Step counter */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 14,
                  }}
                >
                  <div style={{ display: 'flex', gap: 5 }}>
                    {STEPS.map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: i === step ? 18 : 5,
                          height: 5,
                          borderRadius: 999,
                          background:
                            i === step ? '#e8607a' : i < step ? 'rgba(232,96,122,0.4)' : '#1c2333',
                          transition: 'width 0.2s ease, background 0.2s ease',
                        }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={dismiss}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid #1c2333',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <X size={13} color="#6b7280" />
                  </button>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 22,
                    color: '#eeeef0',
                    lineHeight: 1.3,
                    marginBottom: 10,
                  }}
                >
                  {current.title}
                </h3>

                {/* Body */}
                <p
                  style={{
                    fontSize: 13.5,
                    color: '#6b7280',
                    lineHeight: 1.7,
                    marginBottom: 20,
                  }}
                >
                  {current.body}
                </p>

                {/* Actions */}
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <button
                    onClick={dismiss}
                    style={{
                      fontSize: 12,
                      color: '#4b5563',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Skip tour
                  </button>

                  <button
                    onClick={next}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 500,
                      padding: '10px 20px',
                      borderRadius: 24,
                      background: '#e8607a',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.background = '#c4485e'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.background = '#e8607a'
                    }}
                  >
                    {isLast ? 'Enter my world' : 'Next'}
                    {!isLast && <ChevronRight size={14} />}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}
