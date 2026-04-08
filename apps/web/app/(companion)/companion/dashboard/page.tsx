'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Edit2, BookOpen, ImagePlus } from 'lucide-react'

interface Stats {
  display_name:     string
  is_live:          boolean
  profile_views:    number
  pending_bookings: number
  total_bookings:   number
  stories_posted:   number
  photos_uploaded:  number
  is_verified:      boolean
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function StatTile({ label, value, highlight, note }: { label: string; value: number; highlight?: boolean; note?: string }) {
  return (
    <div style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 16, padding: 20 }}>
      <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 600, color: highlight ? '#c9a96e' : '#eeeef0', lineHeight: 1, marginBottom: note ? 6 : 0 }}>
        {value}
      </p>
      {note && <p style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>{note}</p>}
    </div>
  )
}

function QuickAction({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href: string }) {
  const router = useRouter()
  return (
    <div
      onClick={() => router.push(href)}
      style={{
        width: 160, background: '#111620', border: '1px solid #1c2333', borderRadius: 14,
        padding: '18px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', gap: 10, transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(232,96,122,0.3)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = '#1c2333'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}>
      <Icon size={16} color="#e8607a" />
      <span style={{ fontSize: 13, color: '#eeeef0', lineHeight: 1.3 }}>{label}</span>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/companions/dashboard/stats', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (!d.error) setStats(d) })
      .catch(() => {})
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>

      {/* ── Welcome bar ── */}
      <div className="mb-8">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: '#eeeef0', marginBottom: 8 }}>
          {greeting()}{stats?.display_name ? `, ${stats.display_name}` : ''}.
        </h1>
        {stats && (
          <div className="flex items-center gap-2">
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: stats.is_live ? '#34d399' : '#c9a96e',
              boxShadow: stats.is_live ? '0 0 6px rgba(52,211,153,0.5)' : '0 0 6px rgba(201,169,110,0.4)',
            }} />
            <span style={{ fontSize: 13, color: stats.is_live ? '#34d399' : '#c9a96e' }}>
              {stats.is_live ? 'Your profile is live' : 'Pending review'}
            </span>
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatTile label="Profile Views"    value={stats?.profile_views    ?? 0} note="Tracking starts soon" />
        <StatTile label="Pending Bookings" value={stats?.pending_bookings ?? 0} highlight={(stats?.pending_bookings ?? 0) > 0} />
        <StatTile label="Stories Posted"   value={stats?.stories_posted   ?? 0} />
        <StatTile label="Photos Uploaded"  value={stats?.photos_uploaded  ?? 0} />
      </div>

      {/* ── Pending bookings banner ── */}
      {(stats?.pending_bookings ?? 0) > 0 && (
        <div
          onClick={() => router.push('/companion/bookings')}
          style={{
            background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.25)',
            borderRadius: 12, padding: '12px 18px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(201,169,110,0.1)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(201,169,110,0.06)' }}>
          <span style={{ fontSize: 13, color: '#c9a96e' }}>
            You have {stats!.pending_bookings} booking request{stats!.pending_bookings !== 1 ? 's' : ''} waiting.{' '}
            <span style={{ textDecoration: 'underline' }}>Review them →</span>
          </span>
          <ArrowRight size={14} color="#c9a96e" style={{ flexShrink: 0 }} />
        </div>
      )}

      {/* ── Verification card ── */}
      {stats && !stats.is_verified && (
        <div style={{
          background: 'rgba(232,96,122,0.05)', border: '1px solid rgba(232,96,122,0.2)',
          borderRadius: 16, padding: 20, marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <p style={{ fontSize: 13, color: '#eeeef0', margin: 0, flex: 1 }}>
            Identity verification incomplete — verified companions get approved faster.
          </p>
          <button
            onClick={() => router.push('/companion/profile/edit#verify')}
            style={{
              fontSize: 12.5, color: '#e8607a', background: 'rgba(232,96,122,0.08)',
              border: '1px solid rgba(232,96,122,0.3)', borderRadius: 8,
              padding: '8px 16px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'all 0.15s',
            }}>
            Complete verification →
          </button>
        </div>
      )}

      {/* ── Quick actions ── */}
      <div className="flex gap-4 flex-wrap mt-6">
        <QuickAction icon={Edit2}     label="Edit my profile" href="/companion/profile/edit"          />
        <QuickAction icon={BookOpen}  label="Post a story"    href="/companion/content?tab=stories"   />
        <QuickAction icon={ImagePlus} label="Upload a photo"  href="/companion/content?tab=photos"    />
      </div>
    </motion.div>
  )
}
