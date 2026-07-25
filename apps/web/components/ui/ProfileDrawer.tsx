'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'

import { useUIStore } from '@/store/uiStore'

// Shape returned by /api/companions/[profileId]
interface RealCompanionProfile {
  id: string
  companionId: string
  name: string | null
  age: number | null
  city: string | null
  bio: string | null
  tagline: string | null
  minPrice: string | null
  currency: string
  isVerified: boolean
  gradient: string
  primaryPhotoUrl: string | null
  photoUrls: string[]
  tags: string[]
  whatsappNumber: string | null
  telegramHandle: string | null
  videos: Array<{
    id: string
    url: string
    thumbnailUrl: string | null
    durationSeconds: number | null
  }>
  sessionCards: Array<{
    id: string
    title: string | null
    description: string | null
    price: string | null
    sessionType: string | null
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

function buildContactLinks(
  name: string,
  whatsappNumber: string | null,
  telegramHandle: string | null,
  message?: string
) {
  const text = encodeURIComponent(message ?? `Hey ${name}, let's connect`)
  const waNum = whatsappNumber?.replace(/^\+/, '') ?? null
  const tgVal = telegramHandle?.startsWith('@')
    ? telegramHandle.slice(1)
    : telegramHandle ?? null
  return {
    whatsapp: waNum ? `https://wa.me/${waNum}?text=${text}` : null,
    telegram: tgVal ? `https://t.me/${tgVal}` : null,
  }
}

export default function ProfileDrawer() {
  const { activeCompanionId, closeModal, openBookingModal, dreamer, openAuthModal } = useUIStore()
  const [selectedDuration, setSelectedDuration] = useState('2h')
  const [selectedSessionIdx, setSelectedSessionIdx] = useState<number | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const realId = isRealId(activeCompanionId)

  // Reset session selection when a different profile opens
  useEffect(() => {
    setSelectedSessionIdx(null)
  }, [activeCompanionId])

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

  // Normalise to a common display shape (real DB profile only)
  const display = realProfile
    ? {
        name: realProfile.name ?? 'Companion',
        age: realProfile.age,
        city: realProfile.city ?? '',
        vibe: realProfile.tagline ?? '',
        tags: realProfile.tags,
        price: realProfile.minPrice ?? '—',
        gradient: realProfile.gradient,
        photoUrl: realProfile.primaryPhotoUrl,
        photoUrls: realProfile.photoUrls ?? [],
        bio: realProfile.bio ?? VIBE_BIOS['Romantic & in control'],
        isVerified: realProfile.isVerified,
        videos: realProfile.videos ?? [],
        sessions:
          (realProfile.sessionCards ?? []).length > 0
            ? realProfile.sessionCards.map((sc) => ({
                name: sc.title ?? 'Session',
                desc: sc.description ?? '',
                price: sc.price ?? 'On request',
                pills: sc.durationMinutes ? [`${sc.durationMinutes} min`] : [],
              }))
            : [],
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
                    {[80, 60, 72].map((w) => (
                      <div key={w} className="h-6 rounded-full bg-[#1c2333]" style={{ width: w }} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── SECTION A: Hero band ──────────────────────────────────────── */}
              {display && (
                <>
                  {/* Mobile: stack (image → details). Desktop: side-by-side. */}
                  <div
                    className="flex flex-col md:flex-row relative overflow-hidden"
                    style={{ minHeight: 'auto' }}
                  >
                    {/* Close button — always top-right of the modal, above image on mobile */}
                    <button
                      onClick={closeModal}
                      className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-[#6b7280] text-[18px] cursor-pointer transition-all duration-150 leading-none"
                      style={{
                        background: 'rgba(13,17,23,0.75)',
                        border: '1px solid #1c2333',
                        backdropFilter: 'blur(8px)',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLButtonElement
                        el.style.color = '#eeeef0'
                        el.style.background = 'rgba(255,255,255,0.12)'
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLButtonElement
                        el.style.color = '#6b7280'
                        el.style.background = 'rgba(13,17,23,0.75)'
                      }}
                    >
                      ✕
                    </button>

                    {/* Image strip */}
                    <div
                      className="w-full md:w-[220px] md:flex-shrink-0 relative overflow-hidden"
                      style={{ background: display.gradient }}
                    >
                      {display.photoUrl ? (
                        <>
                          {/* Mobile: natural height so full image is always visible */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={display.photoUrl}
                            alt={display.name}
                            className="w-full h-auto block md:hidden"
                            draggable={false}
                          />
                          {/* Desktop: fill the fixed column height */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={display.photoUrl}
                            alt={display.name}
                            className="hidden md:block absolute inset-0 w-full h-full object-cover object-top"
                            draggable={false}
                          />
                        </>
                      ) : (
                        <div className="h-[260px] md:absolute md:inset-0 md:h-full flex items-center justify-center">
                          <svg
                            width="100"
                            height="200"
                            viewBox="0 0 80 160"
                            fill="rgba(255,255,255,0.18)"
                          >
                            <ellipse cx="40" cy="26" rx="20" ry="24" />
                            <path d="M16 90 Q24 55 40 52 Q56 55 64 90 L68 170 Q58 182 40 184 Q24 182 12 170Z" />
                          </svg>
                        </div>
                      )}
                      {/* Bottom fade — mobile only, sits over the image */}
                      <div
                        className="absolute inset-x-0 bottom-0 h-20 md:hidden pointer-events-none"
                        style={{
                          background: 'linear-gradient(to top, #0d1117 0%, transparent 100%)',
                        }}
                      />
                      {/* Right fade — desktop only */}
                      <div
                        className="absolute inset-0 hidden md:block pointer-events-none"
                        style={{
                          background: 'linear-gradient(90deg, transparent 55%, #0d1117 100%)',
                        }}
                      />
                    </div>

                    {/* Details — below image on mobile, right column on desktop */}
                    <div className="flex-1 p-5 md:p-8 flex flex-col justify-between relative">
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
                          style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px' }}
                        >
                          {display.name}
                          {display.age ? (
                            <span style={{ fontSize: 18, color: '#6b7280', fontFamily: 'inherit' }}>
                              , {display.age}
                            </span>
                          ) : null}
                        </h2>

                        {/* Vibe / tagline */}
                        <p className="text-[13px] text-[#6b7280] mb-4">{display.vibe}</p>

                        {/* Badges */}
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                          {display.isVerified && (
                            <span className="verified-badge">✦ Verified &amp; Licensed</span>
                          )}
                          <span
                            className="text-[11px] text-[#e8607a] px-[10px] py-1 rounded-full"
                            style={{
                              background: 'rgba(232,96,122,0.1)',
                              border: '1px solid rgba(232,96,122,0.25)',
                            }}
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
                      <div className="flex gap-5 mt-4 flex-wrap">
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
                    {/* Photo gallery strip — all approved photos */}
                    {display.photoUrls.length > 1 && (
                      <div className="mb-6">
                        <p className="text-[10px] text-[#e8607a] uppercase tracking-[0.1em] font-medium mb-3">
                          Photos
                        </p>
                        <div
                          className="flex gap-2 overflow-x-auto pb-1"
                          style={{ scrollbarWidth: 'none' }}
                        >
                          {display.photoUrls.map((url, i) => (
                            <button
                              key={i}
                              onClick={() => setLightboxUrl(url)}
                              className="flex-shrink-0 rounded-[8px] overflow-hidden"
                              style={{
                                width: 80,
                                height: 108,
                                background: '#111620',
                                border: '1px solid #1c2333',
                                padding: 0,
                                cursor: 'pointer',
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bio */}
                    <p className="text-[13.5px] text-[#6b7280] leading-[1.75] mb-8 max-w-[520px]">
                      {display.bio}
                    </p>

                    {/* Videos */}
                    {display.videos.length > 0 && (
                      <div className="mb-8">
                        <p className="text-[10px] text-[#e8607a] uppercase tracking-[0.1em] font-medium mb-3">
                          Videos
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                          {display.videos.map((v) => (
                            <a
                              key={v.id}
                              href={v.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 relative rounded-[10px] overflow-hidden"
                              style={{
                                width: 120,
                                height: 160,
                                background: '#111620',
                                border: '1px solid #1c2333',
                                display: 'block',
                              }}
                            >
                              {v.thumbnailUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={v.thumbnailUrl}
                                  alt=""
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(255,255,255,0.25)">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              )}
                              {/* Play overlay */}
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'rgba(7,9,15,0.35)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <div
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: 'rgba(232,96,122,0.85)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                              {/* Duration badge */}
                              {v.durationSeconds && (
                                <span
                                  style={{
                                    position: 'absolute',
                                    bottom: 6,
                                    right: 6,
                                    fontSize: 10,
                                    background: 'rgba(7,9,15,0.8)',
                                    color: '#eeeef0',
                                    padding: '2px 5px',
                                    borderRadius: 4,
                                  }}
                                >
                                  {Math.floor(v.durationSeconds / 60)}:{String(v.durationSeconds % 60).padStart(2, '0')}
                                </span>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Session packages */}
                    {display.sessions.length > 0 && (
                    <>
                    <p className="text-[10px] text-[#e8607a] uppercase tracking-[0.1em] font-medium mb-1">
                      Choose an experience
                    </p>
                    <p className="text-[11px] text-[#4b5563] mb-4">
                      Select one to unlock the contact buttons below
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                      {display.sessions.map((session, idx) => (
                        <div
                          key={session.name}
                          className="session-card"
                          onClick={() => setSelectedSessionIdx(idx)}
                          style={
                            selectedSessionIdx === idx
                              ? { borderColor: 'rgba(232,96,122,0.65)', background: 'rgba(232,96,122,0.05)' }
                              : undefined
                          }
                        >
                          {selectedSessionIdx === idx && (
                            <div className="text-[10px] text-[#e8607a] font-medium mb-1">✓ Selected</div>
                          )}
                          <div className="session-name">{session.name}</div>
                          <p className="session-desc">{session.desc}</p>
                          <div className="session-price">{session.price}</div>
                          <div className="flex gap-2 flex-wrap">
                            {session.pills.map((pill) => (
                              <button
                                key={pill}
                                className={`duration-pill${selectedDuration === pill ? ' active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setSelectedDuration(pill) }}
                              >
                                {pill}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    </>
                    )}

                    {/* Primary CTAs — WhatsApp + Telegram */}
                    {(() => {
                      // When no sessions exist, CTAs unlock immediately (no selection needed)
                      const sessionSelected = display.sessions.length === 0 || selectedSessionIdx !== null
                      const selectedDisplay = selectedSessionIdx !== null ? display.sessions[selectedSessionIdx] : null
                      const selectedCard = (selectedSessionIdx !== null && realProfile && (realProfile.sessionCards ?? []).length > 0)
                        ? realProfile.sessionCards[selectedSessionIdx]
                        : null

                      const contactMessage = selectedDisplay
                        ? `Hi ${display.name}! I'd like to book "${selectedDisplay.name}"${selectedDisplay.price && selectedDisplay.price !== 'From —' && selectedDisplay.price !== 'On request' ? ` (${selectedDisplay.price})` : ''}. When are you available?`
                        : undefined

                      const { whatsapp, telegram } = buildContactLinks(
                        display.name,
                        realProfile?.whatsappNumber ?? null,
                        realProfile?.telegramHandle ?? null,
                        contactMessage
                      )

                      function logBooking(channel: 'whatsapp' | 'telegram') {
                        if (!realProfile) return
                        fetch('/api/bookings', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            companion_profile_id: realProfile.id,
                            session_card_id: selectedCard?.id ?? null,
                            message: contactMessage ?? null,
                            channel,
                          }),
                        }).catch(() => {/* fire-and-forget */})
                      }

                      if (!whatsapp && !telegram) {
                        return (
                          <p className="text-center text-[13px] text-[#6b7280] py-3">
                            Contact details coming soon.
                          </p>
                        )
                      }

                      const blurStyle = !sessionSelected
                        ? { filter: 'blur(4px)', opacity: 0.4, pointerEvents: 'none' as const, userSelect: 'none' as const }
                        : {}

                      return (
                        <>
                          {!sessionSelected && display.sessions.length > 0 && (
                            <p className="text-center text-[11.5px] text-[#6b7280] mb-3">
                              Select an experience above to contact {display.name}
                            </p>
                          )}
                          <div className="flex flex-col sm:flex-row gap-3" style={blurStyle}>
                            {whatsapp && (
                              <a
                                href={sessionSelected && dreamer ? whatsapp : undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  if (!dreamer) {
                                    e.preventDefault()
                                    openAuthModal('contact')
                                    return
                                  }
                                  logBooking('whatsapp')
                                }}
                                className="flex-1 flex items-center justify-center gap-[10px] py-[13px] px-5 rounded-[10px] text-[13.5px] font-medium text-white transition-all duration-200 hover:-translate-y-px"
                                style={{
                                  background: 'linear-gradient(135deg, #25D366, #1da851)',
                                  boxShadow: '0 4px 20px rgba(37,211,102,0.22)',
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={(e) => {
                                  ;(e.currentTarget as HTMLAnchorElement).style.boxShadow =
                                    '0 8px 28px rgba(37,211,102,0.38)'
                                }}
                                onMouseLeave={(e) => {
                                  ;(e.currentTarget as HTMLAnchorElement).style.boxShadow =
                                    '0 4px 20px rgba(37,211,102,0.22)'
                                }}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.528 5.855L0 24l6.335-1.505A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.5-5.207-1.378l-.373-.22-3.862.917.974-3.768-.243-.387A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                                </svg>
                                {dreamer ? 'Message on WhatsApp' : 'Sign in to message'}
                              </a>
                            )}

                            {telegram && (
                              <a
                                href={sessionSelected && dreamer ? telegram : undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  if (!dreamer) {
                                    e.preventDefault()
                                    openAuthModal('contact')
                                    return
                                  }
                                  logBooking('telegram')
                                }}
                                className="flex-1 flex items-center justify-center gap-[10px] py-[13px] px-5 rounded-[10px] text-[13.5px] font-medium text-white transition-all duration-200 hover:-translate-y-px"
                                style={{
                                  background: 'linear-gradient(135deg, #229ED9, #1a7fb5)',
                                  boxShadow: '0 4px 20px rgba(34,158,217,0.22)',
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={(e) => {
                                  ;(e.currentTarget as HTMLAnchorElement).style.boxShadow =
                                    '0 8px 28px rgba(34,158,217,0.38)'
                                }}
                                onMouseLeave={(e) => {
                                  ;(e.currentTarget as HTMLAnchorElement).style.boxShadow =
                                    '0 4px 20px rgba(34,158,217,0.22)'
                                }}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.664l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.958.895z" />
                                </svg>
                                {dreamer ? 'Chat on Telegram' : 'Sign in to chat'}
                              </a>
                            )}
                          </div>
                        </>
                      )
                    })()}

                    <p
                      className="text-center text-[11px] text-[#6b7280] mt-3"
                      style={{ opacity: 0.7 }}
                    >
                      Your identity stays private — always.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </>
      )}

      {/* ── Lightbox ────────────────────────────────────────────────────── */}
      {lightboxUrl && (
        <motion.div
          key="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7,9,15,0.92)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#eeeef0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              borderRadius: 12,
              objectFit: 'contain',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
