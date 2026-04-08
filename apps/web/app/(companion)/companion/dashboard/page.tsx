'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  CheckCircle2, Circle, PenLine, BookOpen, Camera, Eye,
  Bell, Link2, ArrowRight,
} from 'lucide-react'
import { useCompanionMode } from '@/hooks/useCompanionMode'
import { useGeolocation } from '@/hooks/useGeolocation'

const CompanionTour = dynamic(() => import('@/components/ui/CompanionTour'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  display_name:         string
  is_live:              boolean
  is_verified:          boolean
  profile_completeness: number
  is_visible_to_users:  boolean
  has_basic_info:       boolean
  has_whatsapp:         boolean
  photos_uploaded:      number
  stories_posted:       number
  pending_bookings:     number
}

interface Analytics {
  profile_views_today: number
  profile_views_week:  number
}

interface Notification {
  id:         string
  title:      string
  body:       string
  is_read:    boolean
  created_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function relativeTime(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const { toggleMode } = useCompanionMode()
  const { latitude, longitude } = useGeolocation()
  const locationSavedRef = useRef(false)

  const [stats,         setStats]         = useState<Stats | null>(null)
  const [analytics,     setAnalytics]     = useState<Analytics | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Silently persist location when available
  useEffect(() => {
    if (latitude === null || longitude === null) return
    if (locationSavedRef.current) return
    locationSavedRef.current = true
    fetch('/api/location', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ latitude, longitude }),
    }).catch(() => {})
  }, [latitude, longitude])

  useEffect(() => {
    fetch('/api/companions/dashboard/stats', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (!d.error) setStats(d) })
      .catch(() => {})

    fetch('/api/companions/analytics/summary', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (!d.error) setAnalytics(d) })
      .catch(() => {})

    fetch('/api/notifications', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.notifications) setNotifications(d.notifications.slice(0, 3)) })
      .catch(() => {})
  }, [])

  // ── Completeness checklist ──
  const checkItems = stats
    ? [
        { key: 'photo',    label: 'Add profile photo',                    done: stats.photos_uploaded > 0, href: '/companion/profile/edit#photos'   },
        { key: 'info',     label: 'Add basic info (name, DOB, country)',  done: stats.has_basic_info,       href: '/companion/profile/edit#basics'   },
        { key: 'whatsapp', label: 'Add WhatsApp number',                  done: stats.has_whatsapp,         href: '/companion/profile/edit#whatsapp' },
        { key: 'story',    label: 'Post your first story or confession',  done: stats.stories_posted > 0,   href: '/companion/content'               },
        { key: 'verify',   label: 'Complete Didit identity verification', done: stats.is_verified,          href: '/companion/profile/edit#verify'   },
      ]
    : []

  const allBasicDone = checkItems.every(i => i.done)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <CompanionTour />

      {/* ── Welcome bar ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1
          style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: '#eeeef0', marginBottom: 8 }}
        >
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

      {/* ── Profile completeness / Live banner ───────────────────────────────── */}
      {stats && (
        <div id="profile-completeness" className="mb-5">
          {stats.is_visible_to_users ? (
            /* Live card */
            <div style={{
              background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.25)',
              borderRadius: 16, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <CheckCircle2 size={18} color="#34d399" />
              <span style={{ fontSize: 13.5, color: '#34d399', fontWeight: 500 }}>
                Your profile is live ✓ Dreamers can find you.
              </span>
            </div>
          ) : (
            /* Completeness banner */
            <div style={{
              background: '#111620', border: '1px solid #1c2333',
              borderRadius: 16, padding: 20,
            }}>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: 14, fontWeight: 600, color: '#eeeef0' }}>Get your profile ready</span>
                <span style={{ fontSize: 13, color: '#e8607a', fontWeight: 600 }}>{stats.profile_completeness}%</span>
              </div>

              {/* Progress bar — CSS transition only, no Framer */}
              <div style={{ width: '100%', height: 4, background: '#1c2333', borderRadius: 999, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{
                  height: '100%',
                  width: `${stats.profile_completeness}%`,
                  background: 'linear-gradient(90deg, #c4485e, #e8607a)',
                  borderRadius: 999,
                  transition: 'width 0.6s ease',
                }} />
              </div>

              {/* Checklist */}
              <div className="flex flex-col gap-2">
                {checkItems.map(item => (
                  <div
                    key={item.key}
                    onClick={() => !item.done && router.push(item.href)}
                    className="flex items-center gap-3 rounded-[10px]"
                    style={{
                      padding: '10px 12px',
                      background: '#0d1117',
                      cursor: item.done ? 'default' : 'pointer',
                    }}
                  >
                    {item.done
                      ? <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0 }} />
                      : <Circle       size={16} color="#6b7280" style={{ flexShrink: 0 }} />
                    }
                    <span style={{
                      fontSize: 13, flex: 1,
                      color: item.done ? '#6b7280' : '#eeeef0',
                      textDecoration: item.done ? 'line-through' : 'none',
                    }}>
                      {item.label}
                    </span>
                    {!item.done && (
                      <ArrowRight size={13} color="#e8607a" style={{ flexShrink: 0 }} />
                    )}
                  </div>
                ))}

                {/* Admin approval row — shows when all basic items done */}
                {allBasicDone && (
                  <div
                    className="flex items-center gap-3 rounded-[10px]"
                    style={{ padding: '10px 12px', background: '#0d1117' }}
                  >
                    <Circle size={16} color="#c9a96e" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#eeeef0', flex: 1 }}>
                      Awaiting admin approval
                    </span>
                    <span
                      style={{
                        fontSize: 10, padding: '3px 10px', borderRadius: 999,
                        background: 'rgba(201,169,110,0.1)',
                        border: '1px solid rgba(201,169,110,0.3)',
                        color: '#c9a96e', fontWeight: 500,
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}
                    >
                      Under Review
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Stats row — only when visible to users ───────────────────────────── */}
      {stats?.is_visible_to_users && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Profile Views (today)', value: analytics?.profile_views_today ?? 0, gold: false },
            { label: 'Profile Views (week)',  value: analytics?.profile_views_week  ?? 0, gold: false },
            { label: 'Stories Posted',        value: stats.stories_posted,                 gold: false },
            { label: 'Pending Bookings',      value: stats.pending_bookings,               gold: stats.pending_bookings > 0 },
          ].map(tile => (
            <div
              key={tile.label}
              style={{
                background: '#111620',
                border: tile.gold ? '1px solid rgba(201,169,110,0.4)' : '1px solid #1c2333',
                borderRadius: 16,
                padding: 20,
              }}
            >
              <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {tile.label}
              </p>
              <p style={{ fontSize: 28, fontWeight: 600, color: tile.gold ? '#c9a96e' : '#eeeef0', lineHeight: 1 }}>
                {tile.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Pending bookings banner ───────────────────────────────────────────── */}
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
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(201,169,110,0.06)' }}
        >
          <span style={{ fontSize: 13, color: '#c9a96e' }}>
            You have {stats!.pending_bookings} booking request{stats!.pending_bookings !== 1 ? 's' : ''} waiting.{' '}
            <span style={{ textDecoration: 'underline' }}>Review them →</span>
          </span>
          <ArrowRight size={14} color="#c9a96e" style={{ flexShrink: 0 }} />
        </div>
      )}

      {/* ── Quick actions ─────────────────────────────────────────────────────── */}
      <div id="quick-actions" className="flex flex-wrap gap-3 mb-5">
        {[
          { icon: PenLine,  label: 'Write confession',   action: () => router.push('/companion/content?tab=confessions') },
          { icon: BookOpen, label: 'Write story',        action: () => router.push('/companion/content?tab=stories')     },
          { icon: Camera,   label: 'Upload photo/video', action: () => router.push('/companion/content?tab=photos')      },
          {
            icon: Eye,
            label: 'Browse as dreamer',
            action: () => {
              toggleMode()
              router.push('/')
            },
          },
        ].map(({ icon: Icon, label, action }) => (
          <div
            key={label}
            onClick={action}
            style={{
              minWidth: 160, background: '#111620', border: '1px solid #1c2333',
              borderRadius: 16, padding: '18px 16px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              gap: 10, transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(232,96,122,0.3)'
              ;(e.currentTarget as HTMLDivElement).style.transform   = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLDivElement).style.borderColor = '#1c2333'
              ;(e.currentTarget as HTMLDivElement).style.transform   = 'translateY(0)'
            }}
          >
            <Icon size={16} color="#e8607a" />
            <span style={{ fontSize: 13, color: '#eeeef0', lineHeight: 1.3 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Recent notifications strip ───────────────────────────────────────── */}
      {notifications.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 13, color: '#eeeef0', fontWeight: 500 }}>Recent activity</span>
            <span
              onClick={() => router.push('/companion/notifications')}
              style={{ fontSize: 12.5, color: '#e8607a', cursor: 'pointer', opacity: 0.8 }}
              onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.opacity = '1' }}
              onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.opacity = '0.8' }}
            >
              See all →
            </span>
          </div>
          <div
            className="flex gap-3 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            {notifications.map(n => (
              <div
                key={n.id}
                style={{
                  minWidth: 220, maxWidth: 260, flexShrink: 0,
                  background: '#111620',
                  border: n.is_read ? '1px solid #1c2333' : '1px solid rgba(232,96,122,0.25)',
                  borderRadius: 12, padding: '12px 14px',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}
              >
                <Bell size={14} color={n.is_read ? '#6b7280' : '#e8607a'} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: '#eeeef0', fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{relativeTime(n.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bridge section ───────────────────────────────────────────────────── */}
      <div id="bridge-section" className="mb-5">
        <div style={{
          background: '#111620', border: '1px solid #1c2333',
          borderRadius: 16, padding: 20,
        }}>
          <div className="flex items-center gap-3 mb-3">
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'rgba(232,96,122,0.1)', border: '1px solid rgba(232,96,122,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Link2 size={16} color="#e8607a" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#eeeef0', marginBottom: 2 }}>Link yourself to stories</div>
              <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                When you connect with a story or confession, your profile appears at the bottom as a bridge to dreamers.
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/companion/bridge')}
            style={{
              fontSize: 13, color: '#e8607a',
              background: 'rgba(232,96,122,0.08)', border: '1px solid rgba(232,96,122,0.25)',
              borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,96,122,0.14)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,96,122,0.08)' }}
          >
            Browse &amp; link stories →
          </button>
        </div>
      </div>
    </motion.div>
  )
}
