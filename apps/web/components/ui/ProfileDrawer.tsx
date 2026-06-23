'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { companions as dummyCompanions } from '@/lib/data'
import { useUIStore } from '@/store/uiStore'

// Shape returned by /api/companions/[profileId]
interface RealCompanionProfile {
  id:              string
  companionId:     string
  name:            string | null
  age:             number | null
  city:            string | null
  bio:             string | null
  tagline:         string | null
  minPrice:        string | null
  currency:        string
  isVerified:      boolean
  gradient:        string
  primaryPhotoUrl: string | null
  photoUrls:       string[]
  tags:            string[]
  sessionCards:    Array<{
    id:              string
    title:           string | null
    description:     string | null
    price:           string | null
    sessionType:     string | null
    durationMinutes: number | null
  }>
}

// UUID-shaped IDs are real DB profile IDs; short numeric IDs are dummy data
function isRealId(id: string | null): boolean {
  if (!id) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

// ─── Per-vibe bios ────────────────────────────────────────────────────────────

const VIBE_BIOS: Record<string, string> = {
  'Romantic & in control':
    'I believe the best evenings begin before the door closes — in the way attention is given, and withheld. My sessions are unhurried, and entirely for you.',
  'Gentle but decisive':
    'There is something clarifying about knowing exactly what you want and offering it without hesitation. I listen deeply, and then I lead.',
  'Intellectual & intense':
    'The most intimate conversations happen when both minds are fully present. I bring precision and depth to every encounter — and genuine curiosity about you.',
  'Warm & unhurried':
    'I have no interest in rushing toward anything. The warmth builds in the pauses, in the small attentions. Time with me simply moves differently.',
  'Mysterious & precise':
    'I choose my words the way others choose silences — with care. Every session is a considered experience, nothing left to chance, and nothing wasted.',
  'Playful & confident':
    'Confidence is its own kind of warmth. I bring lightness to intimacy without losing any of its depth. You will leave wondering why you waited.',
  'Calm & attentive':
    'I notice what others overlook — a shift in posture, a held breath. That quality of attention is the foundation of everything I offer.',
  'Bold & expressive':
    'I do not soften my edges for anyone. What I offer is unapologetic presence — expressive, direct, and entirely on my own terms.',
}

const SESSIONS = [
  {
    name: 'Slow, intimate evening',
    desc: 'Unhurried presence, genuine conversation, complete discretion.',
    pills: ['1h', '2h', 'Evening'],
  },
  {
    name: 'Social companion',
    desc: 'Dinner, gallery, or event — thoughtful company for any occasion.',
    pills: ['2h', 'Half day', 'Full day'],
  },
  {
    name: 'Weekend retreat',
    desc: 'Extended time away. Complete experience, complete privacy.',
    pills: ['Weekend', 'Custom'],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileDrawer() {
  const { activeCompanionId, closeModal, openBookingModal } = useUIStore()
  const [selectedDuration, setSelectedDuration] = useState('2h')

  const realId = isRealId(activeCompanionId)

  // Fetch real companion data when ID is a DB UUID
  const { data: realProfile, isLoading: realLoading } = useQuery<RealCompanionProfile>({
    queryKey: ['companion-profile', activeCompanionId],
    queryFn: async () => {
      const res = await fetch(`/api/companions/${activeCompanionId}`)
      if (!res.ok) throw new Error('Failed to load companion')
      return res.json()
    },
    enabled: realId && !!activeCompanionId,
    staleTime: 5 * 60 * 1000,
  })

  // Normalise to a common display shape whether dummy or real
  const dummyMatch = !realId ? dummyCompanions.find((c) => c.id === activeCompanionId) ?? null : null

  const display = realProfile
    ? {
        name:     realProfile.name ?? 'Companion',
        age:      realProfile.age,
        city:     realProfile.city ?? '',
        vibe:     realProfile.tagline ?? '',
        tags:     realProfile.tags,
        price:    realProfile.minPrice ?? '—',
        gradient: realProfile.gradient,
        photoUrl: realProfile.primaryPhotoUrl,
        bio:      realProfile.bio ?? VIBE_BIOS['Romantic & in control'],
        isVerified: realProfile.isVerified,
        sessions: realProfile.sessionCards.length > 0
          ? realProfile.sessionCards.map(sc => ({
              name: sc.title ?? 'Session',
              desc: sc.description ?? '',
              price: sc.price ?? 'On request',
              pills: sc.durationMinutes
                ? [`${sc.durationMinutes} min`]
                : [],
            }))
          : SESSIONS.map(s => ({ ...s, price: `From —` })),
      }
    : dummyMatch
    ? {
        name:     dummyMatch.name,
        age:      dummyMatch.age,
        city:     dummyMatch.city,
        vibe:     dummyMatch.vibe,
        tags:     dummyMatch.tags,
        price:    dummyMatch.price,
        gradient: dummyMatch.gradient,
        photoUrl: undefined,
        bio:      VIBE_BIOS[dummyMatch.vibe] ?? VIBE_BIOS['Romantic & in control'],
        isVerified: true,
        sessions: SESSIONS.map(s => ({ ...s, price: `From ${dummyMatch.price}` })),
      }
    : null

  const isOpen = !!activeCompanionId && (realLoading || !!display)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="profile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeModal}
            className="modal-overlay"
          >
            {/* Modal */}
            <motion.div
              key="profile-modal"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="modal"
              style={{ maxWidth: '860px' }}
            >
              {/* ── Loading skeleton ─────────────────────────────────────────── */}
              {realLoading && (
                <div className="p-8 flex flex-col gap-4 animate-pulse" style={{ minHeight: 280 }}>
                  <div className="h-4 w-24 rounded-full bg-[#1c2333]" />
                  <div className="h-9 w-48 rounded-[8px] bg-[#1c2333]" />
                  <div className="h-3 w-32 rounded-full bg-[#1c2333]" />
                  <div className="flex gap-2 mt-2">
                    {[80, 60, 72].map(w => <div key={w} className="h-6 rounded-full bg-[#1c2333]" style={{ width: w }} />)}
                  </div>
                </div>
              )}

              {/* ── SECTION A: Hero band ──────────────────────────────────────── */}
              {display && (<>
              <div className="flex relative overflow-hidden" style={{ minHeight: '280px' }}>

                {/* Image strip */}
                <div
                  className="w-[220px] flex-shrink-0 relative overflow-hidden"
                  style={{ background: display.gradient }}
                >
                  {display.photoUrl ? (
                    <img
                      src={display.photoUrl}
                      alt={display.name}
                      className="absolute inset-0 w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg width="100" height="200" viewBox="0 0 80 160" fill="rgba(255,255,255,0.18)">
                        <ellipse cx="40" cy="26" rx="20" ry="24" />
                        <path d="M16 90 Q24 55 40 52 Q56 55 64 90 L68 170 Q58 182 40 184 Q24 182 12 170Z" />
                      </svg>
                    </div>
                  )}
                  {/* Right fade */}
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(90deg, transparent 55%, #0d1117 100%)' }}
                  />
                </div>

                {/* Right content */}
                <div className="flex-1 p-8 flex flex-col justify-between relative">

                  {/* Close button */}
                  <button
                    onClick={closeModal}
                    className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-[#6b7280] text-[18px] cursor-pointer transition-all duration-150 leading-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #1c2333' }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.color = '#eeeef0'
                      el.style.background = 'rgba(255,255,255,0.12)'
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.color = '#6b7280'
                      el.style.background = 'rgba(255,255,255,0.06)'
                    }}
                  >
                    ✕
                  </button>

                  {/* Top group */}
                  <div>
                    {/* Hero chip */}
                    <span className="hero-chip">
                      <span className="w-[6px] h-[6px] rounded-full bg-current inline-block" />
                      {display.isVerified ? 'Verified companion' : 'Companion'}
                    </span>

                    {/* Name */}
                    <h2
                      className="text-[#eeeef0] leading-[1.1] mb-1"
                      style={{ fontFamily: "'Playfair Display', serif", fontSize: '34px' }}
                    >
                      {display.name}{display.age ? <span style={{ fontSize: 20, color: '#6b7280', fontFamily: 'inherit' }}>, {display.age}</span> : null}
                    </h2>

                    {/* Vibe / tagline */}
                    <p className="text-[13px] text-[#6b7280] mb-4">{display.vibe}</p>

                    {/* Badges */}
                    <div className="flex items-center gap-3 mb-5 flex-wrap">
                      {display.isVerified && <span className="verified-badge">✦ Verified &amp; Licensed</span>}
                      <span
                        className="text-[11px] text-[#e8607a] px-[10px] py-1 rounded-full"
                        style={{ background: 'rgba(232,96,122,0.1)', border: '1px solid rgba(232,96,122,0.25)' }}
                      >
                        Active · {display.city}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-[6px]">
                      {display.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Trust row */}
                  <div className="flex gap-5 mt-4 mb-0 flex-wrap">
                    <span className="flex items-center gap-[6px] text-[11.5px] text-[#6b7280]">
                      <span style={{ color: '#c9a96e' }}>🔒</span>Anonymous booking
                    </span>
                    <span className="flex items-center gap-[6px] text-[11.5px] text-[#6b7280]">
                      <span style={{ color: '#c9a96e' }}>✦</span>Verified &amp; licensed
                    </span>
                  </div>
                </div>
              </div>

              {/* ── SECTION B: Body ───────────────────────────────────────────── */}
              <div className="p-8 pt-6">

                {/* Bio */}
                <p className="text-[13.5px] text-[#6b7280] leading-[1.75] mb-8 max-w-[520px]">
                  {display.bio}
                </p>

                {/* Session packages */}
                <p className="text-[10px] text-[#e8607a] uppercase tracking-[0.1em] font-medium mb-4">
                  Choose an experience
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {display.sessions.map((session) => (
                    <div key={session.name} className="session-card">
                      <div className="session-name">{session.name}</div>
                      <p className="session-desc">{session.desc}</p>
                      <div className="session-price">{session.price}</div>
                      <div className="flex gap-2 flex-wrap">
                        {session.pills.map((pill) => (
                          <button
                            key={pill}
                            className={`duration-pill${selectedDuration === pill ? ' active' : ''}`}
                            onClick={() => setSelectedDuration(pill)}
                          >
                            {pill}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  className="btn-primary w-full text-center"
                  onClick={() => openBookingModal()}
                >
                  Choose an experience &amp; book
                </button>

                <p className="text-center text-[11px] text-[#6b7280] mt-3" style={{ opacity: 0.7 }}>
                  Your identity stays anonymous until you choose to share it.
                </p>
              </div>
              </>)}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
