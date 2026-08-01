'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface VideoPlayerModalProps {
  url: string
  companionName: string | null
  city: string | null
  profileId: string
  onClose: () => void
}

export default function VideoPlayerModal({
  url,
  companionName,
  city,
  profileId,
  onClose,
}: VideoPlayerModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 900,
          background: 'rgba(7,9,15,0.88)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 760,
            background: '#0d1117',
            border: '1px solid #1c2333',
            borderRadius: 20,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 10,
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid #1c2333',
              color: '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              lineHeight: 1,
              transition: 'background 150ms ease, color 150ms ease',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,96,122,0.15)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#e8607a'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#6b7280'
            }}
          >
            ✕
          </button>

          {/* Video */}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={url}
            controls
            autoPlay
            playsInline
            style={{
              width: '100%',
              display: 'block',
              maxHeight: '70vh',
              background: '#07090f',
            }}
          />

          {/* Footer */}
          <div
            style={{
              padding: '14px 20px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 16,
                  fontStyle: 'italic',
                  color: '#eeeef0',
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {companionName ?? 'Companion'}
              </p>
              {city && (
                <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>{city}</p>
              )}
            </div>

            <Link
              href={`/companions/${profileId}`}
              onClick={onClose}
              style={{
                fontSize: 12.5,
                color: '#e8607a',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                opacity: 0.85,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
            >
              View profile →
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
