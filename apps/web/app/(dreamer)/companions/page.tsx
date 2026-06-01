'use client'

import { useState, useCallback } from 'react'
import {
  motion, AnimatePresence,
  useMotionValue, useTransform, useAnimation,
} from 'framer-motion'
import { MapPin, Heart, X, Star, RefreshCw, Globe } from 'lucide-react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useDiscoverCompanions } from '@/hooks/useDiscoverCompanions'
import type { DiscoverCompanionItem } from '@/app/api/companions/discover/route'
import { useUIStore } from '@/store/uiStore'

// ─── Radius options ─────────────────────────────────────────────────────────────
const RADIUS_OPTIONS: { label: string; value: number | null }[] = [
  { label: '10 km',     value: 10   },
  { label: '25 km',     value: 25   },
  { label: '50 km',     value: 50   },
  { label: '100 km',    value: 100  },
  { label: 'Worldwide', value: null },
]

// ─── Gradient pool (keyed by profile id hash) ──────────────────────────────────

const GRADIENTS = [
  'linear-gradient(145deg,#1a1228,#2a1535,#1a2240)',
  'linear-gradient(145deg,#0f1a28,#1f2840,#2a1020)',
  'linear-gradient(145deg,#201228,#1a2030,#2a1a18)',
  'linear-gradient(145deg,#0a1620,#1a1535,#201a10)',
  'linear-gradient(145deg,#1a1020,#2a1530,#101820)',
  'linear-gradient(145deg,#101820,#201028,#102020)',
]
function gradientFromId(id: string) {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return GRADIENTS[hash % GRADIENTS.length]
}

// ─── Swipe Card ────────────────────────────────────────────────────────────────

interface SwipeCardProps {
  companion: DiscoverCompanionItem
  stackIndex: number   // 0 = top, 1 = second, 2 = third
  onLike:   () => void
  onSkip:   () => void
}

function SwipeCard({ companion, stackIndex, onLike, onSkip }: SwipeCardProps) {
  const openModal = useUIStore(s => s.openModal)
  const x         = useMotionValue(0)
  const rotate    = useTransform(x, [-160, 0, 160], [-14, 0, 14])
  const roseOpacity = useTransform(x, [0, 80, 160], [0, 0.5, 1])
  const skipOpacity = useTransform(x, [-160, -80, 0], [1, 0.5, 0])
  const controls  = useAnimation()

  const gradient   = companion.gradient || gradientFromId(companion.id)
  const isTop      = stackIndex === 0
  const peekScale  = stackIndex === 1 ? 0.95 : 0.90
  const peekY      = stackIndex === 1 ? 14 : 26

  async function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x > 80) {
      await controls.start({ x: 500, rotate: 20, opacity: 0, transition: { duration: 0.3 } })
      onLike()
    } else if (info.offset.x < -80) {
      await controls.start({ x: -500, rotate: -20, opacity: 0, transition: { duration: 0.3 } })
      onSkip()
    } else {
      controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } })
    }
  }

  const distanceText = companion.distance_km !== null && companion.distance_km !== undefined
    ? `${Math.round(companion.distance_km as number)} km away`
    : null

  return (
    <motion.div
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={isTop ? handleDragEnd : undefined}
      animate={isTop ? controls : { scale: peekScale, y: peekY, opacity: 1 }}
      initial={isTop ? { scale: 1, y: 0, opacity: 1 } : { scale: peekScale, y: peekY, opacity: 1 }}
      style={isTop ? { x, rotate, zIndex: 30 - stackIndex, position: 'absolute', inset: 0, cursor: 'grab', touchAction: 'none' } : { zIndex: 30 - stackIndex, position: 'absolute', inset: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Card shell */}
      <div
        style={{
          width: '100%', height: '100%',
          background: gradient,
          borderRadius: 24,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: isTop ? '0 32px 80px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.4)',
          position: 'relative',
          userSelect: 'none',
        }}
        onClick={isTop ? () => openModal(companion.companionId) : undefined}
      >
        {/* Photo */}
        {companion.primaryPhotoUrl && (
          <img
            src={companion.primaryPhotoUrl}
            alt={companion.name ?? ''}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
            draggable={false}
          />
        )}

        {/* Bottom gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(7,9,15,0.95) 0%, rgba(7,9,15,0.4) 45%, transparent 70%)',
        }} />

        {/* Rose glow — right swipe */}
        {isTop && (
          <motion.div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(232,96,122,0.35) 0%, transparent 60%)',
            opacity: roseOpacity, pointerEvents: 'none',
          }} />
        )}

        {/* Skip tint — left swipe */}
        {isTop && (
          <motion.div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(225deg, rgba(100,110,130,0.35) 0%, transparent 60%)',
            opacity: skipOpacity, pointerEvents: 'none',
          }} />
        )}

        {/* Like / Nope badge */}
        {isTop && (
          <>
            <motion.div style={{
              position: 'absolute', top: 28, left: 24,
              padding: '8px 18px', borderRadius: 8,
              border: '3px solid #e8607a', color: '#e8607a',
              fontSize: 20, fontWeight: 800, letterSpacing: 2,
              opacity: roseOpacity, transform: 'rotate(-15deg)',
              pointerEvents: 'none',
            }}>LIKE</motion.div>
            <motion.div style={{
              position: 'absolute', top: 28, right: 24,
              padding: '8px 18px', borderRadius: 8,
              border: '3px solid #6b7280', color: '#6b7280',
              fontSize: 20, fontWeight: 800, letterSpacing: 2,
              opacity: skipOpacity, transform: 'rotate(15deg)',
              pointerEvents: 'none',
            }}>NOPE</motion.div>
          </>
        )}

        {/* Verified + session modality badge */}
        <div style={{
          position: 'absolute', top: 20, right: 20,
          display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end',
        }}>
          {companion.isVerified && (
            <span style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 999,
              color: '#c9a96e', background: 'rgba(201,169,110,0.15)',
              border: '1px solid rgba(201,169,110,0.35)',
            }}>✦ Verified</span>
          )}
          {companion.sessionModality === 'online' && (
            <span style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 999,
              color: '#60a5fa', background: 'rgba(96,165,250,0.12)',
              border: '1px solid rgba(96,165,250,0.3)',
            }}>Online</span>
          )}
          {companion.sessionModality === 'both' && (
            <span style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 999,
              color: '#34d399', background: 'rgba(52,211,153,0.12)',
              border: '1px solid rgba(52,211,153,0.3)',
            }}>In person + Online</span>
          )}
        </div>

        {/* Bottom info */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 24px 28px' }}>
          {/* Dots indicator */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {companion.tags.slice(0, 3).map((_, i) => (
              <div key={i} style={{
                width: i === 0 ? 20 : 6, height: 4, borderRadius: 2,
                background: i === 0 ? '#e8607a' : 'rgba(255,255,255,0.3)',
                transition: 'width 0.2s',
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#eeeef0', fontWeight: 600 }}>
              {companion.name}
            </span>
            {companion.age && (
              <span style={{ fontSize: 20, color: '#9ca3af', fontWeight: 300 }}>{companion.age}</span>
            )}
          </div>

          {/* Location row — city + distance, always prominent */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <MapPin size={12} color="#e8607a" strokeWidth={2} />
            {companion.city && (
              <span style={{ fontSize: 13, color: '#eeeef0', fontWeight: 500 }}>{companion.city}</span>
            )}
            {distanceText && (
              <>
                <span style={{ fontSize: 12, color: '#6b7280' }}>·</span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{distanceText}</span>
              </>
            )}
            {companion.minPrice && (
              <>
                <span style={{ fontSize: 12, color: '#6b7280' }}>·</span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{companion.minPrice}/eve</span>
              </>
            )}
          </div>

          {companion.vibe && (
            <p style={{ fontSize: 13, color: '#c4c8d0', marginBottom: 10, lineHeight: 1.4, maxWidth: 280 }}>
              {companion.vibe}
            </p>
          )}

          {companion.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {companion.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: 10, padding: '3px 10px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#9ca3af',
                }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Action Button ──────────────────────────────────────────────────────────────

function ActionBtn({
  onClick, size, children, color, bg, border: borderStyle,
}: {
  onClick: () => void
  size: number
  children: React.ReactNode
  color: string
  bg: string
  border: string
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.08 }}
      style={{
        width: size, height: size, borderRadius: '50%',
        border: borderStyle, background: bg, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
        boxShadow: `0 8px 24px ${bg === 'transparent' ? 'rgba(0,0,0,0.3)' : bg.replace(')', ',0.4)').replace('rgb', 'rgba')}`,
      }}
    >
      {children}
    </motion.button>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CompanionsPage() {
  const { latitude, longitude, loading: geoLoading, permission, isSupported, requestLocation } = useGeolocation()
  const hasLocation = latitude !== null && longitude !== null

  const [radiusKm, setRadiusKm]   = useState<number | null>(100)
  const [sessionKey, setSessionKey] = useState(0)

  // When worldwide selected, disable distance scoring (pass null lat/lng)
  const effectiveLat = radiusKm === null ? null : latitude
  const effectiveLng = radiusKm === null ? null : longitude

  const { companions, isLoading, isFetchingMore, hasNextPage, fetchNextPage, error } =
    useDiscoverCompanions({
      lat: effectiveLat,
      lng: effectiveLng,
      radius: radiusKm ?? 100,
      sessionKey,
    })

  const [cursor, setCursor] = useState(0)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  const currentCompanions = companions.slice(cursor)
  const topThree          = currentCompanions.slice(0, 3)

  const advance = useCallback((dir: 'left' | 'right') => {
    setCursor(c => {
      const next = c + 1
      // Pre-fetch next page when we get near the end
      if (companions.length - next <= 4 && hasNextPage && !isFetchingMore) {
        fetchNextPage()
      }
      return next
    })
    if (dir === 'right') setLikedIds(ids => { const s = new Set(ids); s.add(companions[cursor]?.id ?? ''); return s })
  }, [companions, cursor, hasNextPage, isFetchingMore, fetchNextPage])

  const handleLike = useCallback(() => advance('right'), [advance])
  const handleSkip = useCallback(() => advance('left'),  [advance])

  const isEmpty    = !isLoading && currentCompanions.length === 0
  const showStack  = !isLoading && topThree.length > 0

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#07090f', display: 'flex', flexDirection: 'column', paddingTop: 75, zIndex: 1 }}>
      {/* Noise texture */}
      <div className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }} />

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(232,96,122,0.05) 0%, transparent 70%)' }} />

      {/* ── Status bar ────────────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 20px 0', flexShrink: 0, zIndex: 2 }}>
        {/* Location banner — only when distance filter is active and location not granted */}
        {radiusKm !== null && !hasLocation && isSupported && permission !== 'granted' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px', borderRadius: 12,
              background: 'rgba(232,96,122,0.07)', border: '1px solid rgba(232,96,122,0.2)',
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={13} color="#e8607a" />
              <span style={{ fontSize: 12, color: '#6b7280' }}>Allow location for companions near you</span>
            </div>
            <button
              onClick={requestLocation}
              disabled={geoLoading}
              style={{
                fontSize: 12, padding: '10px 16px', borderRadius: 999, minHeight: 44,
                background: 'rgba(232,96,122,0.12)', border: '1px solid rgba(232,96,122,0.35)',
                color: '#e8607a', cursor: geoLoading ? 'default' : 'pointer', flexShrink: 0,
                opacity: geoLoading ? 0.6 : 1,
              }}
            >
              {geoLoading ? 'Locating…' : 'Allow →'}
            </button>
          </motion.div>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#eeeef0', marginBottom: 2 }}>
              {radiusKm === null ? 'Worldwide' : hasLocation ? 'Near you' : 'Discover'}
            </h1>
            <p style={{ fontSize: 11, color: '#6b7280' }}>
              {isLoading
                ? 'Finding companions…'
                : isEmpty
                  ? 'You\'ve seen everyone'
                  : `${currentCompanions.length} companion${currentCompanions.length !== 1 ? 's' : ''} to explore`}
            </p>
          </div>
          {/* Like counter */}
          {likedIds.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#e8607a' }}>
              <Heart size={12} fill="#e8607a" />
              <span>{likedIds.size}</span>
            </div>
          )}
        </div>

        {/* Radius filter pills */}
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4,
          scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' as any,
        }}>
          {RADIUS_OPTIONS.map(opt => {
            const isActive = radiusKm === opt.value
            return (
              <button
                key={String(opt.value)}
                onClick={() => {
                  setRadiusKm(opt.value)
                  setCursor(0)
                  setLikedIds(new Set())
                  setSessionKey(k => k + 1)
                }}
                style={{
                  flexShrink: 0,
                  fontSize: 12, padding: '10px 14px', borderRadius: 999, minHeight: 44,
                  border: isActive ? '1px solid rgba(232,96,122,0.5)' : '1px solid #1c2333',
                  background: isActive ? 'rgba(232,96,122,0.12)' : 'transparent',
                  color: isActive ? '#e8607a' : '#6b7280',
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                {opt.value === null && <Globe size={10} />}
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Swipe area ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 20px', zIndex: 2, minHeight: 0 }}>

        {/* Loading skeleton */}
        {isLoading && (
          <div style={{
            width: '100%', maxWidth: 380,
            aspectRatio: '3/4',
            borderRadius: 24,
            background: 'linear-gradient(145deg,#111620,#161d2a)',
            border: '1px solid #1c2333',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
              animation: 'shimmer 1.4s ease-in-out infinite',
            }} />
            <div style={{ position: 'absolute', bottom: 28, left: 24, right: 24 }}>
              <div style={{ height: 28, width: '60%', borderRadius: 6, background: '#1c2333', marginBottom: 10 }} />
              <div style={{ height: 13, width: '40%', borderRadius: 4, background: '#1c2333', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                {[60, 50, 70].map((w, i) => <div key={i} style={{ height: 20, width: w, borderRadius: 999, background: '#1c2333' }} />)}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', maxWidth: 320 }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
              background: 'rgba(232,96,122,0.08)', border: '1px solid rgba(232,96,122,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <RefreshCw size={28} color="#e8607a" />
            </div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#eeeef0', marginBottom: 10 }}>
              You&apos;ve explored everyone nearby
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
              More companions join every day. Come back soon, or expand your search radius.
            </p>
            <button
              onClick={() => {
                setSessionKey(k => k + 1)
                setCursor(0)
                setLikedIds(new Set())
              }}
              style={{
                fontSize: 13, padding: '10px 24px', borderRadius: 10,
                background: 'rgba(232,96,122,0.1)', border: '1px solid rgba(232,96,122,0.3)',
                color: '#e8607a', cursor: 'pointer',
              }}
            >
              Start over
            </button>
          </motion.div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div style={{ textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
            Something slipped away. Try again.
          </div>
        )}

        {/* Card stack */}
        {showStack && (
          <div style={{
            width: '100%', maxWidth: 400,
            position: 'relative',
            aspectRatio: '3/4.2',
          }}>
            <AnimatePresence mode="sync">
              {topThree.map((companion, i) => (
                <SwipeCard
                  key={`${companion.id}-${sessionKey}`}
                  companion={companion}
                  stackIndex={i}
                  onLike={handleLike}
                  onSkip={handleSkip}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Action row ────────────────────────────────────────────────────────── */}
      {showStack && (
        <div style={{
          padding: '16px 24px',
          paddingBottom: 'calc(64px + env(safe-area-inset-bottom) + 16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24,
          flexShrink: 0, zIndex: 2,
        }}>
          {/* Skip */}
          <ActionBtn
            onClick={handleSkip}
            size={60}
            color="#9ca3af"
            bg="rgba(28,35,51,0.9)"
            border="1px solid #1c2333"
          >
            <X size={22} strokeWidth={2.5} />
          </ActionBtn>

          {/* Save / Super like */}
          <ActionBtn
            onClick={() => {}} // TODO: save to bookmarks
            size={52}
            color="#c9a96e"
            bg="rgba(201,169,110,0.08)"
            border="1px solid rgba(201,169,110,0.3)"
          >
            <Star size={18} fill="rgba(201,169,110,0.2)" />
          </ActionBtn>

          {/* Like */}
          <ActionBtn
            onClick={handleLike}
            size={60}
            color="#fff"
            bg="#e8607a"
            border="none"
          >
            <Heart size={22} fill="white" />
          </ActionBtn>
        </div>
      )}

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%) }
          100% { transform: translateX(100%) }
        }
      `}</style>
    </div>
  )
}
