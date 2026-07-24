'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, CheckCircle } from 'lucide-react'
import type { CityCompanion } from '@/lib/cityPage'

const COMMUNITY_CONFIG = {
  female: { label: 'Female', accentColor: '#e8607a' },
  male: { label: 'Male', accentColor: '#60a5fa' },
  shemale: { label: 'Trans', accentColor: '#c084fc' },
}

const GRADIENTS = [
  'linear-gradient(145deg,#1a1228,#2a1535,#1a2240)',
  'linear-gradient(145deg,#0f1a28,#1f2840,#2a1020)',
  'linear-gradient(145deg,#201228,#1a2030,#2a1a18)',
  'linear-gradient(145deg,#0a1620,#1a1535,#201a10)',
  'linear-gradient(145deg,#1a1020,#2a1530,#101820)',
]
function gradient(id: string) {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return GRADIENTS[h % GRADIENTS.length]
}

export default function CityCompanionGrid({
  community,
  city,
  cityName,
  companions,
}: {
  community: 'female' | 'male' | 'shemale'
  city: string
  cityName: string
  companions: CityCompanion[]
}) {
  const cfg = COMMUNITY_CONFIG[community]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#07090f',
        paddingTop: 76,
        paddingBottom: 100,
      }}
    >
      {/* Page header */}
      <div style={{ padding: '32px 20px 20px', maxWidth: 960, margin: '0 auto' }}>
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <Link href="/" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}>BlushBite</Link>
          <span style={{ fontSize: 12, color: '#4b5563' }}>/</span>
          <Link href={`/${community}`} style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}>
            {cfg.label}
          </Link>
          <span style={{ fontSize: 12, color: '#4b5563' }}>/</span>
          <span style={{ fontSize: 12, color: cfg.accentColor }}>{cityName}</span>
        </nav>

        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(24px, 5vw, 36px)',
            color: '#eeeef0',
            marginBottom: 8,
            lineHeight: 1.2,
          }}
        >
          {cfg.label} Companions in{' '}
          <em style={{ fontStyle: 'italic', color: cfg.accentColor }}>{cityName}</em>
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
          {companions.length > 0
            ? `${companions.length} companion${companions.length !== 1 ? 's' : ''} advertising time and companionship`
            : 'No companions listed in this city yet'}
        </p>
        <p style={{ fontSize: 12, color: '#4b5563' }}>
          EU-hosted · GDPR compliant · Adults 18+ only
        </p>
      </div>

      {/* Grid */}
      {companions.length > 0 ? (
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '0 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 16,
          }}
        >
          {companions.map((c) => (
            <CompanionCard key={c.profileId} companion={c} community={community} accentColor={cfg.accentColor} />
          ))}
        </div>
      ) : (
        <div
          style={{
            maxWidth: 960,
            margin: '40px auto',
            padding: '0 20px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              padding: '48px 32px',
              borderRadius: 16,
              background: '#0d1117',
              border: '1px solid #1c2333',
            }}
          >
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20,
                color: '#eeeef0',
                marginBottom: 10,
              }}
            >
              No companions in {cityName} yet.
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
              New companions join every day. Check back soon.
            </p>
            <Link
              href={`/${community}`}
              style={{
                fontSize: 13,
                padding: '10px 24px',
                borderRadius: 10,
                background: `rgba(${community === 'female' ? '232,96,122' : community === 'male' ? '96,165,250' : '192,132,252'},0.1)`,
                border: `1px solid ${cfg.accentColor}40`,
                color: cfg.accentColor,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Browse all {cfg.label.toLowerCase()} companions →
            </Link>
          </div>
        </div>
      )}

      {/* CTA for companions */}
      <div
        style={{
          maxWidth: 960,
          margin: '48px auto 0',
          padding: '0 20px',
        }}
      >
        <div
          style={{
            padding: '28px 24px',
            borderRadius: 16,
            background: '#0d1117',
            border: `1px solid ${cfg.accentColor}22`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#eeeef0', marginBottom: 4 }}>
              Are you a companion in {cityName}?
            </p>
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              Join BlushBite — go live in minutes, no approval wait.
            </p>
          </div>
          <a
            href="https://blushbite.live"
            style={{
              fontSize: 14,
              fontWeight: 500,
              padding: '12px 24px',
              borderRadius: 10,
              background: cfg.accentColor,
              color: '#fff',
              textDecoration: 'none',
              flexShrink: 0,
              display: 'inline-block',
            }}
          >
            Join BlushBite →
          </a>
        </div>
      </div>
    </div>
  )
}

function CompanionCard({
  companion,
  community,
  accentColor,
}: {
  companion: CityCompanion
  community: string
  accentColor: string
}) {
  const href = `/companions/${companion.companionId}`

  return (
    <Link
      href={href}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          background: companion.photoUrl ? 'transparent' : gradient(companion.profileId),
          border: '1px solid #1c2333',
          cursor: 'pointer',
          transition: 'border-color 0.15s, transform 0.15s',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.borderColor = `${accentColor}50`
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.borderColor = '#1c2333'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        }}
      >
        {/* Photo */}
        <div style={{ position: 'relative', aspectRatio: '3/4', background: gradient(companion.profileId) }}>
          {companion.photoUrl && (
            <Image
              src={companion.photoUrl}
              alt={companion.name ?? 'Companion'}
              fill
              style={{ objectFit: 'cover', objectPosition: 'top' }}
              sizes="(max-width: 480px) 50vw, (max-width: 960px) 33vw, 200px"
            />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(7,9,15,0.9) 0%, transparent 50%)',
            }}
          />
          {companion.isVerified && (
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
              <CheckCircle size={14} color="#c9a96e" fill="rgba(201,169,110,0.2)" />
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 15,
                color: '#eeeef0',
                marginBottom: 2,
                lineHeight: 1.2,
              }}
            >
              {companion.name}{companion.age ? `, ${companion.age}` : ''}
            </p>
            {companion.city && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <MapPin size={10} color={accentColor} />
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{companion.city}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info strip */}
        <div style={{ padding: '10px 12px' }}>
          {companion.tagline && (
            <p
              style={{
                fontSize: 11,
                color: '#6b7280',
                lineHeight: 1.4,
                marginBottom: companion.minRate ? 6 : 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {companion.tagline}
            </p>
          )}
          {companion.minRate && (
            <span
              style={{
                fontSize: 11,
                color: accentColor,
                background: `${accentColor}12`,
                border: `1px solid ${accentColor}30`,
                borderRadius: 999,
                padding: '2px 8px',
                display: 'inline-block',
              }}
            >
              from {companion.minRate}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
