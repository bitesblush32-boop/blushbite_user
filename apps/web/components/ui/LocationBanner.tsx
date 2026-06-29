'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Loader2 } from 'lucide-react'
import { useGeolocation } from '@/hooks/useGeolocation'

export default function LocationBanner() {
  const { latitude, longitude, loading, permission, isSupported, requestLocation } =
    useGeolocation()
  const [dismissed, setDismissed] = useState(false)
  const savedRef = useRef(false)

  // Read sessionStorage after mount (SSR-safe)
  useEffect(() => {
    if (sessionStorage.getItem('bb_loc_dismissed') === '1') setDismissed(true)
  }, [])

  // When coordinates come in for the first time, persist to DB
  useEffect(() => {
    if (latitude === null || longitude === null) return
    if (savedRef.current) return
    savedRef.current = true
    fetch('/api/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude }),
    }).catch(() => {})
  }, [latitude, longitude])

  const dismiss = () => {
    sessionStorage.setItem('bb_loc_dismissed', '1')
    setDismissed(true)
  }

  const show = isSupported && latitude === null && !dismissed && permission !== 'granted'

  const isDenied = permission === 'denied'

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 72, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 72, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 64, // above BottomNav (64px)
            height: 72,
            zIndex: 750,
            background: 'linear-gradient(to right, #111620, #0d1117)',
            borderTop: '1px solid #1c2333',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '100%',
              padding: '0 16px',
              gap: 12,
            }}
          >
            {/* Left: icon + text */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <MapPin size={18} color="#e8607a" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#eeeef0', lineHeight: 1.4 }}>
                {isDenied
                  ? 'Location blocked — enable in browser settings to find nearby companions'
                  : 'Enable location to see nearby companions'}
              </span>
            </div>

            {/* Right: enable button + dismiss */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {!isDenied && (
                <button
                  onClick={requestLocation}
                  disabled={loading}
                  style={{
                    fontSize: 11,
                    padding: '7px 14px',
                    borderRadius: 9999,
                    background: '#e8607a',
                    color: '#ffffff',
                    border: 'none',
                    cursor: loading ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: loading ? 0.7 : 1,
                    minHeight: 32,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {loading ? (
                    <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    'Enable'
                  )}
                </button>
              )}
              <button
                onClick={dismiss}
                aria-label="Dismiss"
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: 18,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
