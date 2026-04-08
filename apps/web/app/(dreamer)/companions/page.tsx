'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, SlidersHorizontal } from 'lucide-react'
import { companions as dummyCompanions } from '@/lib/data'
import { useGeolocation } from '@/hooks/useGeolocation'
import CompanionCard from '@/components/ui/CompanionCard'

// ─── Framer stagger variants ───────────────────────────────────────────────────

const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
}
const cardItem = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface NearbyCompanion {
  id:                  string
  companion_id:        string
  alias:               string | null
  name:                string | null
  city:                string | null
  tagline:             string | null
  hourly_rate:         string | null
  currency:            string
  availability_status: string
  body_type:           string | null
  height_cm:           number | null
  distance_km:         number
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CompanionsPage() {
  const { latitude, longitude, loading: geoLoading, permission, isSupported, requestLocation } =
    useGeolocation()

  const [radiusKm,       setRadiusKm]       = useState(25)
  const [nearbyData,     setNearbyData]      = useState<NearbyCompanion[] | null>(null)
  const [nearbyLoading,  setNearbyLoading]   = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasLocation = latitude !== null && longitude !== null

  // Fetch nearby companions whenever lat/lng/radius changes
  const fetchNearby = useCallback((lat: number, lng: number, radius: number) => {
    setNearbyLoading(true)
    fetch(`/api/companions/nearby?lat=${lat}&lng=${lng}&radius=${radius}`)
      .then(r => r.json())
      .then(d => { if (d.data) setNearbyData(d.data) })
      .catch(() => {})
      .finally(() => setNearbyLoading(false))
  }, [])

  useEffect(() => {
    if (!hasLocation) return
    fetchNearby(latitude, longitude, radiusKm)
  }, [latitude, longitude, fetchNearby]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRadiusChange = (value: number) => {
    setRadiusKm(value)
    if (!hasLocation) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchNearby(latitude!, longitude!, value)
    }, 500)
  }

  // Map nearby results to the shape CompanionCard expects (Companion type)
  const nearbyCards = (nearbyData ?? []).map((c, i) => ({
    id:       c.companion_id,
    name:     c.name ?? 'Unknown',
    age:      0,
    city:     c.city ?? '',
    price:    c.hourly_rate ? `${c.currency}${parseFloat(c.hourly_rate).toFixed(0)}` : '',
    vibe:     c.tagline ? `${c.tagline} · ${c.distance_km}km away` : `${c.distance_km}km away`,
    tags:     c.body_type ? [c.body_type] : [],
    gradient: dummyCompanions[i % dummyCompanions.length].gradient,
  }))

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-[1400px] mx-auto px-5 md:px-10 pt-[95px] pb-20"
    >
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1
          style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#eeeef0', marginBottom: 6 }}
        >
          Companions near{' '}
          <em style={{ fontStyle: 'italic', color: '#e8607a' }}>you</em>
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
          {hasLocation
            ? `Showing companions within ${radiusKm}km of your location.`
            : 'Share your location to discover companions nearby.'}
        </p>
      </div>

      {/* ── No-location prompt ──────────────────────────────────────────────── */}
      {!hasLocation && isSupported && permission !== 'granted' && (
        <div
          style={{
            background:    '#111620',
            border:        '1px solid #1c2333',
            borderRadius:  14,
            padding:       '16px 20px',
            marginBottom:  24,
            display:       'flex',
            alignItems:    'center',
            justifyContent: 'space-between',
            gap:           12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={16} color="#e8607a" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              Enable location to see companions near you
            </span>
          </div>
          <button
            onClick={requestLocation}
            disabled={geoLoading}
            style={{
              fontSize:    12,
              padding:     '7px 16px',
              borderRadius: 9999,
              background:  'rgba(232,96,122,0.1)',
              border:      '1px solid rgba(232,96,122,0.3)',
              color:       '#e8607a',
              cursor:      geoLoading ? 'default' : 'pointer',
              whiteSpace:  'nowrap',
              flexShrink:  0,
              opacity:     geoLoading ? 0.6 : 1,
            }}
          >
            {geoLoading ? 'Locating…' : 'Enable →'}
          </button>
        </div>
      )}

      {/* ── Distance slider — animates in when location available ───────────── */}
      <AnimatePresence>
        {hasLocation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background:   '#111620',
              border:       '1px solid #1c2333',
              borderRadius: 16,
              padding:      16,
              marginBottom: 16,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SlidersHorizontal size={14} color="#e8607a" />
                <span style={{ fontSize: 14, color: '#e8607a', fontWeight: 500 }}>
                  Distance: {radiusKm}km
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#6b7280' }}>5km ←————→ 100km</span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={radiusKm}
              onChange={e => handleRadiusChange(parseInt(e.target.value, 10))}
              style={{
                width:       '100%',
                accentColor: '#e8607a',
                height:      4,
                cursor:      'pointer',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Section header ──────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <div
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#eeeef0', marginBottom: 4 }}
          >
            {hasLocation ? 'Nearby companions' : 'All companions'}
          </div>
          <p style={{ fontSize: 12, color: '#6b7280', maxWidth: 480, lineHeight: 1.5 }}>
            {hasLocation
              ? `${nearbyCards.length} found within ${radiusKm}km`
              : 'Curated companions available now.'}
          </p>
        </div>
      </div>

      {/* ── Loading skeleton ─────────────────────────────────────────────────── */}
      {(nearbyLoading || geoLoading) && (
        <div
          className="flex gap-4 flex-wrap"
          style={{ marginBottom: 24 }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="shimmer"
              style={{
                width: 220, height: 300, borderRadius: 14,
                background: '#111620',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Companion grid — nearby results ─────────────────────────────────── */}
      {hasLocation && !nearbyLoading && nearbyCards.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{
            display:               'grid',
            gridTemplateColumns:   'repeat(auto-fill, minmax(220px, 1fr))',
            gap:                   18,
          }}
        >
          {nearbyCards.map(c => (
            <motion.div key={c.id} variants={cardItem}>
              <CompanionCard companion={c} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Empty nearby state ──────────────────────────────────────────────── */}
      {hasLocation && !nearbyLoading && nearbyCards.length === 0 && (
        <div
          style={{
            padding:       '48px 24px',
            textAlign:     'center',
            background:    '#111620',
            border:        '1px solid #1c2333',
            borderRadius:  16,
          }}
        >
          <MapPin size={28} color="#6b7280" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
            No companions within {radiusKm}km yet.
          </p>
          <p style={{ fontSize: 12, color: '#4b5563' }}>
            Try expanding the distance slider above.
          </p>
        </div>
      )}

      {/* ── Fallback grid — all companions (no location) ─────────────────────── */}
      {!hasLocation && !geoLoading && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap:                 18,
          }}
        >
          {dummyCompanions.map(c => (
            <motion.div key={c.id} variants={cardItem}>
              <CompanionCard companion={c} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.main>
  )
}
