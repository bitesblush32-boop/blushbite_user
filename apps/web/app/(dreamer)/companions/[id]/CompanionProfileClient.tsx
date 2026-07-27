'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'

interface SessionCardData {
  id: string
  title: string | null
  description: string | null
  price: string | null
  durationMinutes: number | null
}

interface VideoData {
  id: string
  url: string
  thumbnailUrl: string | null
  durationSeconds: number | null
}

interface Props {
  profileId: string
  companionName: string
  photoUrls: string[]
  videos: VideoData[]
  bio: string | null
  sessionCards: SessionCardData[]
  whatsappNumber: string | null
  telegramHandle: string | null
  instagramHandle: string | null
  gradient: string
  accentColor: string
}

function buildContactLinks(
  name: string,
  waNumber: string | null,
  tgHandle: string | null,
  message?: string
) {
  const text = encodeURIComponent(message ?? `Hi ${name}, I found your profile on BlushBite`)
  const waNum = waNumber?.replace(/^\+/, '') ?? null
  const tgVal = tgHandle?.startsWith('@') ? tgHandle.slice(1) : (tgHandle ?? null)
  return {
    whatsapp: waNum ? `https://wa.me/${waNum}?text=${text}` : null,
    telegram: tgVal ? `https://t.me/${tgVal}` : null,
  }
}

function logBooking(
  profileId: string,
  sessionCardId: string | null,
  message: string | null,
  channel: 'whatsapp' | 'telegram'
) {
  fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companion_profile_id: profileId,
      session_card_id: sessionCardId,
      message,
      channel,
    }),
  }).catch(() => {
    /* fire-and-forget */
  })
}

export default function CompanionProfileClient({
  profileId,
  companionName,
  photoUrls,
  videos,
  bio,
  sessionCards,
  whatsappNumber,
  telegramHandle,
  instagramHandle,
  accentColor,
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const { dreamer, openAuthModal } = useUIStore()

  const sessionSelected = sessionCards.length === 0 || selectedIdx !== null
  const selectedCard = selectedIdx !== null ? sessionCards[selectedIdx] : null

  const contactMessage = selectedCard
    ? `Hi ${companionName}! I'd like to book "${selectedCard.title}"${selectedCard.price ? ` (${selectedCard.price})` : ''}. When are you available?`
    : undefined

  const { whatsapp, telegram } = buildContactLinks(
    companionName,
    whatsappNumber,
    telegramHandle,
    contactMessage
  )

  const blurStyle: React.CSSProperties = !sessionSelected
    ? { filter: 'blur(4px)', opacity: 0.4, pointerEvents: 'none', userSelect: 'none' }
    : {}

  return (
    <>
      {/* Photo gallery — clickable thumbnails */}
      {photoUrls.length > 1 && (
        <div style={{ marginBottom: 24 }}>
          <p
            style={{
              fontSize: 10,
              color: '#e8607a',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            Photos
          </p>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={
              {
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x mandatory',
              } as React.CSSProperties
            }
          >
            {photoUrls.map((url, i) => (
              <button
                key={i}
                onClick={() => setLightboxUrl(url)}
                style={{
                  flexShrink: 0,
                  width: 80,
                  height: 108,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#111620',
                  border: '1px solid #1c2333',
                  padding: 0,
                  cursor: 'pointer',
                  scrollSnapAlign: 'start',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top',
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      {bio && (
        <p
          style={{
            fontSize: 13.5,
            color: '#6b7280',
            lineHeight: 1.75,
            marginBottom: 32,
            maxWidth: 520,
            whiteSpace: 'pre-wrap',
          }}
        >
          {bio}
        </p>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <p
            style={{
              fontSize: 10,
              color: '#e8607a',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            Videos
          </p>
          <div
            className="flex gap-3 overflow-x-auto pb-1"
            style={
              {
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x mandatory',
              } as React.CSSProperties
            }
          >
            {videos.map((v) => (
              <a
                key={v.id}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flexShrink: 0,
                  width: 120,
                  height: 160,
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: '#111620',
                  border: '1px solid #1c2333',
                  display: 'block',
                  position: 'relative',
                  scrollSnapAlign: 'start',
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
                    {Math.floor(v.durationSeconds / 60)}:
                    {String(v.durationSeconds % 60).padStart(2, '0')}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Session cards */}
      {sessionCards.length > 0 && (
        <>
          <p
            style={{
              fontSize: 10,
              color: '#e8607a',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            Choose an experience
          </p>
          <p style={{ fontSize: 11, color: '#4b5563', marginBottom: 16 }}>
            Select one to unlock the contact buttons below
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ marginBottom: 32 }}>
            {sessionCards.map((sc, idx) => (
              <div
                key={sc.id}
                onClick={() => setSelectedIdx(idx)}
                style={{
                  border:
                    selectedIdx === idx ? '1px solid rgba(232,96,122,0.65)' : '1px solid #1c2333',
                  background: selectedIdx === idx ? 'rgba(232,96,122,0.05)' : '#111620',
                  borderRadius: 12,
                  padding: 16,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                {selectedIdx === idx && (
                  <div style={{ fontSize: 10, color: '#e8607a', fontWeight: 500, marginBottom: 4 }}>
                    ✓ Selected
                  </div>
                )}
                <div style={{ fontSize: 13.5, color: '#eeeef0', fontWeight: 500, marginBottom: 4 }}>
                  {sc.title ?? 'Session'}
                </div>
                {sc.description && (
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, lineHeight: 1.5 }}>
                    {sc.description}
                  </p>
                )}
                <div
                  style={{
                    fontSize: 12,
                    color: accentColor,
                    marginBottom: sc.durationMinutes ? 8 : 0,
                  }}
                >
                  {sc.price ?? 'On request'}
                </div>
                {sc.durationMinutes && (
                  <span
                    style={{
                      fontSize: 10,
                      color: '#6b7280',
                      border: '1px solid #1c2333',
                      borderRadius: 999,
                      padding: '3px 10px',
                      display: 'inline-block',
                    }}
                  >
                    {sc.durationMinutes} min
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* CTAs */}
      {whatsapp || telegram ? (
        <>
          {!sessionSelected && sessionCards.length > 0 && (
            <p style={{ textAlign: 'center', fontSize: 11.5, color: '#6b7280', marginBottom: 12 }}>
              Select an experience above to contact {companionName}
            </p>
          )}
          <div
            className="flex flex-col sm:flex-row gap-3"
            style={{ ...blurStyle, marginBottom: 12 }}
          >
            {whatsapp && (
              <a
                href={sessionSelected && dreamer ? whatsapp : undefined}
                target="_blank"
                rel="noopener noreferrer nofollow"
                onClick={(e) => {
                  if (!dreamer) {
                    e.preventDefault()
                    openAuthModal('contact')
                    return
                  }
                  logBooking(
                    profileId,
                    selectedCard?.id ?? null,
                    contactMessage ?? null,
                    'whatsapp'
                  )
                }}
                className="flex-1 flex items-center justify-center gap-[10px] py-[13px] px-5 rounded-[10px] text-[13.5px] font-medium text-white transition-all duration-200 hover:-translate-y-px"
                style={{
                  background: 'linear-gradient(135deg,#25D366,#1da851)',
                  boxShadow: '0 4px 20px rgba(37,211,102,0.22)',
                  textDecoration: 'none',
                  cursor: 'pointer',
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
                rel="noopener noreferrer nofollow"
                onClick={(e) => {
                  if (!dreamer) {
                    e.preventDefault()
                    openAuthModal('contact')
                    return
                  }
                  logBooking(
                    profileId,
                    selectedCard?.id ?? null,
                    contactMessage ?? null,
                    'telegram'
                  )
                }}
                className="flex-1 flex items-center justify-center gap-[10px] py-[13px] px-5 rounded-[10px] text-[13.5px] font-medium text-white transition-all duration-200 hover:-translate-y-px"
                style={{
                  background: 'linear-gradient(135deg,#229ED9,#1a7fb5)',
                  boxShadow: '0 4px 20px rgba(34,158,217,0.22)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.664l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.958.895z" />
                </svg>
                {dreamer ? 'Chat on Telegram' : 'Sign in to chat'}
              </a>
            )}
          </div>
          {instagramHandle && (
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <a
                href={`https://instagram.com/${instagramHandle.replace(/^@/, '')}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
                style={{
                  fontSize: 12,
                  color: '#9ca3af',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  opacity: 0.8,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                @{instagramHandle.replace(/^@/, '')}
              </a>
            </div>
          )}
        </>
      ) : (
        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: '#6b7280',
            padding: '12px 0',
            marginBottom: 12,
          }}
        >
          Contact details coming soon.
        </p>
      )}

      <p
        style={{
          textAlign: 'center',
          fontSize: 11,
          color: '#6b7280',
          marginBottom: 4,
          opacity: 0.7,
        }}
      >
        Your identity stays private — always.
      </p>
      <p style={{ textAlign: 'center', fontSize: 11, color: '#4b5563', lineHeight: 1.5 }}>
        This companion advertises their time and companionship independently. BlushBite is a
        classified platform — not a booking service.
      </p>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLightboxUrl(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9000,
              background: 'rgba(0,0,0,0.92)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              cursor: 'zoom-out',
            }}
          >
            <motion.img
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.22 }}
              src={lightboxUrl}
              alt=""
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: 12,
                cursor: 'default',
              }}
            />
            <button
              onClick={() => setLightboxUrl(null)}
              style={{
                position: 'fixed',
                top: 20,
                right: 20,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(13,17,23,0.8)',
                border: '1px solid #1c2333',
                color: '#9ca3af',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
