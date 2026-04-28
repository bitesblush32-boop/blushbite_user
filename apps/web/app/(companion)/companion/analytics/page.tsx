'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, MessageCircle, Link2, BarChart2, TrendingUp, Wifi, WifiOff } from 'lucide-react'
import useSWR from 'swr'

// ── Fetcher ────────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json())

// ── Types ──────────────────────────────────────────────────────────────────────

interface AnalyticsSummary {
  profile_views:    { today: number; week: number; month: number }
  whatsapp_clicks:  { month: number }
  bridge_clicks:    { month: number }
  chart:            { date: string; count: number }[]
  is_visible_to_users: boolean
}

// ── Stagger ────────────────────────────────────────────────────────────────────

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const tile      = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function Shimmer({ h, r = 12 }: { h: number; r?: number }) {
  return (
    <div className="shimmer" style={{ height: h, borderRadius: r, background: '#111620' }} />
  )
}

function StatTile({
  icon: Icon, color, bg, label, value, sub,
}: {
  icon: React.ElementType
  color: string
  bg: string
  label: string
  value: number | string
  sub?: string
}) {
  return (
    <motion.div
      variants={tile}
      style={{
        background: '#111620',
        border: '1px solid #1c2333',
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 9999,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <p style={{ fontSize: 10, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </p>
        <p style={{ fontSize: 26, fontWeight: 600, color: '#eeeef0', lineHeight: 1 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {sub && (
          <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{sub}</p>
        )}
      </div>
    </motion.div>
  )
}

// ── Chart ──────────────────────────────────────────────────────────────────────

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null)

  // Pad to 30 days if fewer entries
  const padded = (() => {
    if (data.length === 0) return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(Date.now() - (29 - i) * 86400000)
      return { date: d.toISOString().slice(0, 10), count: 0 }
    })
    return data.slice(-30)
  })()

  const max = Math.max(...padded.map(d => d.count), 1)

  function fmtDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Y-axis hint */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 6, paddingLeft: 2,
      }}>
        <span style={{ fontSize: 10, color: '#4b5563' }}>{max}</span>
        <span style={{ fontSize: 10, color: '#4b5563' }}>0</span>
      </div>

      {/* Bars */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 3,
        height: 80,
        position: 'relative',
      }}>
        {padded.map((d, i) => {
          const pct = d.count / max
          const barH = Math.max(pct * 80, d.count > 0 ? 4 : 2)
          const isHovered = hovered === i
          return (
            <div
              key={d.date}
              title={`${fmtDate(d.date)}: ${d.count}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                flex: 1,
                height: barH,
                borderRadius: '2px 2px 0 0',
                background: isHovered ? '#e8607a' : d.count > 0 ? 'rgba(232,96,122,0.45)' : '#1c2333',
                transition: 'background 0.15s, height 0.3s',
                cursor: 'default',
                position: 'relative',
              }}
            >
              {isHovered && d.count > 0 && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: 4,
                  background: '#161d2a',
                  border: '1px solid #1c2333',
                  borderRadius: 6,
                  padding: '3px 7px',
                  whiteSpace: 'nowrap',
                  fontSize: 10,
                  color: '#eeeef0',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}>
                  {d.count}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* X-axis: show first, mid, last */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingLeft: 2, paddingRight: 2 }}>
        <span style={{ fontSize: 10, color: '#4b5563' }}>{fmtDate(padded[0].date)}</span>
        <span style={{ fontSize: 10, color: '#4b5563' }}>{fmtDate(padded[Math.floor(padded.length / 2)].date)}</span>
        <span style={{ fontSize: 10, color: '#4b5563' }}>{fmtDate(padded[padded.length - 1].date)}</span>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CompanionAnalyticsPage() {
  const { data, isLoading } = useSWR<AnalyticsSummary>(
    '/api/companions/analytics/summary',
    fetcher,
    { refreshInterval: 60_000, refreshWhenHidden: false, refreshWhenOffline: false },
  )

  const visible = data?.is_visible_to_users ?? true

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <BarChart2 size={20} color="#e8607a" />
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#eeeef0', margin: 0 }}>
          Analytics
        </h1>
        <span style={{
          fontSize: 11, color: '#6b7280',
          background: '#111620', border: '1px solid #1c2333',
          borderRadius: 9999, padding: '3px 10px',
        }}>
          Last 30 days
        </span>
      </div>

      {/* ── Visibility card ─────────────────────────────────────────────────── */}
      {!isLoading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: '#111620',
          border: `1px solid ${visible ? 'rgba(52,211,153,0.25)' : 'rgba(232,96,122,0.25)'}`,
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 20,
        }}>
          {visible
            ? <Wifi size={16} color="#34d399" />
            : <WifiOff size={16} color="#e8607a" />
          }
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#eeeef0', margin: 0 }}>
              {visible ? 'Your profile is live' : 'Your profile is hidden'}
            </p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: 0, marginTop: 2 }}>
              {visible
                ? 'Dreamers can discover and view your profile.'
                : 'Complete your profile setup to become visible to dreamers.'}
            </p>
          </div>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: visible ? '#34d399' : '#e8607a',
            flexShrink: 0,
          }} />
        </div>
      )}

      {/* ── Stat tiles ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => <Shimmer key={i} h={106} />)}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}
        >
          <StatTile
            icon={Eye} color="#e8607a" bg="rgba(232,96,122,0.12)"
            label="Profile views today"
            value={data?.profile_views.today ?? 0}
          />
          <StatTile
            icon={TrendingUp} color="#34d399" bg="rgba(52,211,153,0.12)"
            label="Profile views this week"
            value={data?.profile_views.week ?? 0}
          />
          <StatTile
            icon={Eye} color="#c9a96e" bg="rgba(201,169,110,0.12)"
            label="Profile views this month"
            value={data?.profile_views.month ?? 0}
          />
          <StatTile
            icon={MessageCircle} color="#e8607a" bg="rgba(232,96,122,0.12)"
            label="WhatsApp clicks"
            value={data?.whatsapp_clicks.month ?? 0}
            sub="This month"
          />
          <StatTile
            icon={Link2} color="#c9a96e" bg="rgba(201,169,110,0.12)"
            label="Bridge clicks"
            value={data?.bridge_clicks.month ?? 0}
            sub="This month"
          />
          <StatTile
            icon={BarChart2} color="#6b7280" bg="rgba(107,114,128,0.12)"
            label="Conversion rate"
            value={(() => {
              const views = data?.profile_views.month ?? 0
              const clicks = (data?.whatsapp_clicks.month ?? 0) + (data?.bridge_clicks.month ?? 0)
              if (!views) return '—'
              return `${((clicks / views) * 100).toFixed(1)}%`
            })()}
            sub="Clicks ÷ views"
          />
        </motion.div>
      )}

      {/* ── Chart ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#111620',
        border: '1px solid #1c2333',
        borderRadius: 16,
        padding: '20px 20px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <BarChart2 size={15} color="#6b7280" />
          <p style={{ fontSize: 13, fontWeight: 500, color: '#eeeef0', margin: 0 }}>
            Profile views — daily
          </p>
        </div>

        {isLoading ? (
          <Shimmer h={106} r={8} />
        ) : (
          <BarChart data={data?.chart ?? []} />
        )}
      </div>
    </motion.div>
  )
}
