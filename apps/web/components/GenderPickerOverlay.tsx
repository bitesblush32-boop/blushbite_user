'use client'

import { useState } from 'react'

interface Props {
  onSelect: (gender: string) => void
}

const OPTIONS = [
  {
    id: 'female',
    label: 'Women',
    emoji: '✦',
    desc: 'Female companions',
    color: '#e8607a',
    bg: 'rgba(232,96,122,0.08)',
    border: 'rgba(232,96,122,0.3)',
  },
  {
    id: 'male',
    label: 'Men',
    emoji: '◆',
    desc: 'Male companions',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.3)',
  },
  {
    id: 'shemale',
    label: 'Trans',
    emoji: '◈',
    desc: 'Trans & TS companions',
    color: '#c9a96e',
    bg: 'rgba(201,169,110,0.08)',
    border: 'rgba(201,169,110,0.3)',
  },
] as const

export default function GenderPickerOverlay({ onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(7,9,15,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            fontSize: 13,
            letterSpacing: '0.18em',
            color: '#e8607a',
            textTransform: 'uppercase',
            marginBottom: 32,
            fontWeight: 500,
          }}
        >
          BlushBite
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 30,
            color: '#eeeef0',
            lineHeight: 1.2,
            marginBottom: 10,
          }}
        >
          Who would you like to meet
          <br />
          <em style={{ fontStyle: 'italic', color: '#e8607a' }}>tonight?</em>
        </h1>

        <p
          style={{
            fontSize: 13,
            color: '#6b7280',
            marginBottom: 36,
            lineHeight: 1.6,
          }}
        >
          We&apos;ll remember your preference privately.
        </p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {OPTIONS.map((opt) => {
            const isHovered = hovered === opt.id
            return (
              <button
                key={opt.id}
                onMouseEnter={() => setHovered(opt.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '18px 22px',
                  borderRadius: 14,
                  border: `1px solid ${isHovered ? opt.border : '#1c2333'}`,
                  background: isHovered ? opt.bg : '#0d1117',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    color: opt.color,
                    width: 28,
                    flexShrink: 0,
                    textAlign: 'center',
                  }}
                >
                  {opt.emoji}
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: isHovered ? opt.color : '#eeeef0',
                      marginBottom: 2,
                      transition: 'color 0.18s ease',
                    }}
                  >
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{opt.desc}</div>
                </div>
                <span
                  style={{
                    fontSize: 18,
                    color: isHovered ? opt.color : '#1c2333',
                    transition: 'color 0.18s ease',
                  }}
                >
                  →
                </span>
              </button>
            )
          })}
        </div>

        {/* Discretion note */}
        <p
          style={{
            fontSize: 11,
            color: '#4b5563',
            marginTop: 28,
            lineHeight: 1.6,
          }}
        >
          Anonymous · No account needed · Change anytime in settings
        </p>
      </div>
    </div>
  )
}
