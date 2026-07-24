'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone,
  TrendingUp,
  LayoutPanelTop,
  PanelRight,
  Star,
  ChevronLeft,
  ChevronRight,
  Settings2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  X,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface BoostRow {
  id: string
  companion_id: string
  companion_name: string | null
  companion_email: string
  boost_type: string
  community: string
  week_start: string
  week_end: string
  price_eur: string
  status: 'active' | 'cancelled' | 'expired'
  payment_status: string
  is_enabled: boolean
  banner_headline: string | null
  banner_tagline: string | null
  created_at: string
}

interface BoostStats {
  header_active: number
  rail_active: number
  featured_active: number
  revenue_this_week: string
}

interface BoostResponse {
  data: BoostRow[]
  meta: { total: number; page: number; limit: number }
  stats: BoostStats
}

interface SettingsRow {
  header_banner_enabled: boolean
  right_rail_enabled: boolean
  mid_grid_enabled: boolean
  featured_enabled: boolean
  price_featured_eur: string
  price_header_banner_eur: string
  price_right_rail_eur: string
  price_mid_grid_eur: string
  max_weeks_advance: number
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
}

const BOOST_LABELS: Record<string, string> = {
  featured_1: 'Featured #1',
  featured_2: 'Featured #2',
  featured_3: 'Featured #3',
  header_banner: 'Header Banner',
  right_rail: 'Right Rail',
  mid_grid: 'Mid-Grid',
}

const COMMUNITY_LABELS: Record<string, string> = {
  female: 'Female',
  male: 'Male',
  shemale: 'TS/Shemale',
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiTile({
  icon: Icon,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: React.ElementType
  iconColor: string
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="bg-[#111620] border border-[#1c2333] rounded-[16px] p-5">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center flex-shrink-0"
          style={{ background: `${iconColor}18` }}
        >
          <Icon size={16} color={iconColor} />
        </div>
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#6b7280',
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{ fontSize: 32, fontWeight: 600, color: '#eeeef0', lineHeight: 1, marginBottom: 6 }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: '#6b7280' }}>{sub}</div>}
    </div>
  )
}

function StatusBadge({ status }: { status: BoostRow['status'] }) {
  const cfg = {
    active: {
      color: '#4ade80',
      bg: 'rgba(74,222,128,0.10)',
      border: 'rgba(74,222,128,0.25)',
      label: 'Active',
    },
    cancelled: {
      color: '#f87171',
      bg: 'rgba(248,113,113,0.10)',
      border: 'rgba(248,113,113,0.25)',
      label: 'Cancelled',
    },
    expired: {
      color: '#6b7280',
      bg: 'rgba(255,255,255,0.04)',
      border: '#1c2333',
      label: 'Expired',
    },
  }[status]
  return (
    <span
      style={{
        fontSize: 11,
        padding: '3px 10px',
        borderRadius: 99,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {cfg.label}
    </span>
  )
}

function BoostTypeBadge({ type }: { type: string }) {
  const isHeader = type === 'header_banner'
  const isRail = type === 'right_rail'
  const isFeatured = type.startsWith('featured_')
  const color = isHeader ? '#c9a96e' : isRail ? '#e8607a' : isFeatured ? '#818cf8' : '#6b7280'
  return (
    <span
      style={{
        fontSize: 11,
        padding: '3px 10px',
        borderRadius: 99,
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
      }}
    >
      {BOOST_LABELS[type] ?? type}
    </span>
  )
}

function CommunityChip({ community }: { community: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        padding: '2px 8px',
        borderRadius: 99,
        color: '#6b7280',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid #1c2333',
      }}
    >
      {COMMUNITY_LABELS[community] ?? community}
    </span>
  )
}

// ── Bulk delete modal ───────────────────────────────────────────────────────────

function BulkDeleteAdsModal({
  count,
  onConfirm,
  onCancel,
  isPending,
}: {
  count: number
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-[6px] z-[900] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#0d1117] border border-[#1c2333] rounded-[20px] w-full max-w-[440px] overflow-hidden"
      >
        <div
          className="h-[2px]"
          style={{ background: 'linear-gradient(90deg,transparent,#ef4444,transparent)' }}
        />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                <Trash2 size={16} color="#ef4444" />
              </div>
              <h3
                style={{ fontFamily: "'Playfair Display', serif" }}
                className="text-[20px] text-[#eeeef0]"
              >
                Delete {count} boost{count !== 1 ? 's' : ''}
              </h3>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#6b7280] hover:text-[#eeeef0] hover:bg-white/[0.06] transition-all"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-[13px] text-[#6b7280] leading-[1.6] mb-4">
            This will permanently delete{' '}
            <span className="text-[#eeeef0]">{count} selected boost record{count !== 1 ? 's' : ''}</span>{' '}
            from the database. Companions will lose their placement history for these slots.
          </p>
          <p className="text-[12px] text-[#ef4444] mb-5">This action cannot be undone.</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isPending}
              className="flex-1 bg-transparent text-[#6b7280] border border-[#1c2333] px-4 py-[10px] rounded-[10px] text-[13px] cursor-pointer transition-all hover:border-white/20 hover:text-[#eeeef0] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 text-white border-none px-4 py-[10px] rounded-[10px] text-[13px] font-medium cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: '#ef4444' }}
            >
              {isPending ? 'Deleting…' : `Delete ${count} permanently`}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Settings panel ─────────────────────────────────────────────────────────────

function SettingsPanel() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Partial<SettingsRow>>({})

  const { data, isLoading } = useQuery<{ data: SettingsRow }>({
    queryKey: ['admin', 'boost-settings'],
    queryFn: () => fetch('/api/admin/boost-settings').then((r) => r.json()),
  })

  const saveMutation = useMutation({
    mutationFn: async (patch: Partial<SettingsRow>) => {
      const res = await fetch('/api/admin/boost-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Failed to save')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'boost-settings'] })
      setDraft({})
    },
  })

  const s = data?.data
  const merged = { ...s, ...draft }

  const priceFields: { key: keyof SettingsRow; label: string }[] = [
    { key: 'price_header_banner_eur', label: 'Header Banner (€/wk)' },
    { key: 'price_right_rail_eur', label: 'Right Rail (€/wk)' },
    { key: 'price_mid_grid_eur', label: 'Mid-Grid (€/wk)' },
    { key: 'price_featured_eur', label: 'Featured Slots (€/wk)' },
  ]

  const enabledFields: { key: keyof SettingsRow; label: string }[] = [
    { key: 'header_banner_enabled', label: 'Header Banner' },
    { key: 'right_rail_enabled', label: 'Right Rail' },
    { key: 'mid_grid_enabled', label: 'Mid-Grid' },
    { key: 'featured_enabled', label: 'Featured' },
  ]

  return (
    <div className="border border-[#1c2333] rounded-[16px] overflow-hidden" style={{ background: '#111620' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-left"
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
      >
        <div className="flex items-center gap-3">
          <Settings2 size={16} color="#6b7280" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#eeeef0' }}>Slot Settings</span>
          <span style={{ fontSize: 12, color: '#6b7280' }}>— pricing & enabled status</span>
        </div>
        {open ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-[#1c2333] p-5">
              {isLoading ? (
                <div className="h-[80px] animate-pulse rounded-[10px]" style={{ background: '#1c2333' }} />
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Prices */}
                  <div>
                    <p style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                      Pricing
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {priceFields.map(({ key, label }) => (
                        <div key={key} className="flex flex-col gap-1">
                          <label style={{ fontSize: 11, color: '#6b7280' }}>{label}</label>
                          <input
                            type="number"
                            value={String(merged[key] ?? '')}
                            onChange={(e) => setDraft((p) => ({ ...p, [key]: e.target.value }))}
                            className="bg-[#0d1117] border border-[#1c2333] rounded-[8px] px-3 py-[8px] text-[13px] text-[#eeeef0] outline-none focus:border-[rgba(232,96,122,0.5)] w-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enabled toggles */}
                  <div>
                    <p style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                      Slot Enabled
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {enabledFields.map(({ key, label }) => {
                        const enabled = merged[key] as boolean | undefined
                        return (
                          <button
                            key={key}
                            onClick={() => setDraft((p) => ({ ...p, [key]: !enabled }))}
                            style={{
                              fontSize: 12,
                              padding: '6px 14px',
                              borderRadius: 99,
                              cursor: 'pointer',
                              border: `1px solid ${enabled ? 'rgba(74,222,128,0.4)' : '#1c2333'}`,
                              color: enabled ? '#4ade80' : '#6b7280',
                              background: enabled ? 'rgba(74,222,128,0.08)' : 'transparent',
                            }}
                          >
                            {enabled ? '● ' : '○ '}{label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Max advance weeks */}
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <label style={{ fontSize: 11, color: '#6b7280' }}>Max weeks in advance</label>
                      <input
                        type="number"
                        value={String(merged.max_weeks_advance ?? '')}
                        onChange={(e) => setDraft((p) => ({ ...p, max_weeks_advance: parseInt(e.target.value) }))}
                        className="w-[100px] bg-[#0d1117] border border-[#1c2333] rounded-[8px] px-3 py-[8px] text-[13px] text-[#eeeef0] outline-none focus:border-[rgba(232,96,122,0.5)]"
                      />
                    </div>
                    <button
                      onClick={() => saveMutation.mutate(draft)}
                      disabled={saveMutation.isPending || Object.keys(draft).length === 0}
                      className="mt-4 self-end bg-[#e8607a] hover:bg-[#c4485e] text-white border-none px-5 py-[9px] rounded-[8px] text-[13px] font-medium cursor-pointer transition-all disabled:opacity-50"
                    >
                      {saveMutation.isPending ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Status + filter tabs ───────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'expired', label: 'Expired' },
]

// ── Main page ──────────────────────────────────────────────────────────────────

const cardItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
}
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

export default function AdminAdsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkModal, setShowBulkModal] = useState(false)
  const queryClient = useQueryClient()

  const queryKey = ['admin', 'boosts', statusFilter, page]

  const { data, isLoading } = useQuery<BoostResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ status: statusFilter, page: String(page) })
      const res = await fetch(`/api/admin/boosts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    staleTime: 30_000,
  })

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/boosts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'boosts'] })
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/admin/boosts/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => {
      setSelectedIds(new Set())
      setShowBulkModal(false)
      queryClient.invalidateQueries({ queryKey: ['admin', 'boosts'] })
    },
  })

  // Clear selection when filter or page changes
  useEffect(() => {
    setSelectedIds(new Set())
  }, [statusFilter, page])

  const rows = data?.data ?? []
  const meta = data?.meta
  const stats = data?.stats
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1

  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id))
  const toggleOne = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const toggleAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(rows.map((r) => r.id)))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="p-6 md:p-10 min-h-screen"
      style={{ background: '#07090f' }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 28,
            color: '#eeeef0',
            marginBottom: 4,
          }}
        >
          Ad Slots
        </h1>
        <p style={{ fontSize: 12, color: '#6b7280' }}>
          Companion boost bookings — header banner, right rail, featured & mid-grid placements
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#111620] border border-[#1c2333] rounded-[16px] h-[110px] animate-pulse"
              />
            ))}
          </>
        ) : (
          <>
            <KpiTile
              icon={Megaphone}
              iconColor="#c9a96e"
              label="Header Banner (this week)"
              value={stats?.header_active ?? 0}
              sub="active header placements"
            />
            <KpiTile
              icon={PanelRight}
              iconColor="#e8607a"
              label="Right Rail (this week)"
              value={stats?.rail_active ?? 0}
              sub="active right rail placements"
            />
            <KpiTile
              icon={Star}
              iconColor="#818cf8"
              label="Featured Slots (this week)"
              value={stats?.featured_active ?? 0}
              sub="active featured placements"
            />
            <KpiTile
              icon={TrendingUp}
              iconColor="#4ade80"
              label="Revenue this week"
              value={`€${parseFloat(stats?.revenue_this_week ?? '0').toFixed(2)}`}
              sub="from all active boosts"
            />
          </>
        )}
      </div>

      {/* Settings panel */}
      <div className="mb-8">
        <SettingsPanel />
      </div>

      {/* All-time total */}
      <div className="flex items-center justify-between mb-4">
        <p style={{ fontSize: 13, color: '#6b7280' }}>
          {meta ? `${meta.total} total boost${meta.total !== 1 ? 's' : ''}` : ''}
        </p>
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setStatusFilter(t.key); setPage(1) }}
              className="text-[12px] px-[14px] py-[6px] rounded-full border cursor-pointer transition-all duration-150"
              style={{
                borderColor: statusFilter === t.key ? '#e8607a' : '#1c2333',
                color: statusFilter === t.key ? '#e8607a' : '#6b7280',
                background: statusFilter === t.key ? 'rgba(232,96,122,0.08)' : 'transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-[14px] overflow-hidden border border-[#1c2333] mb-6">
        <table className="w-full">
          <thead>
            <tr style={{ background: '#111620', borderBottom: '1px solid #1c2333' }}>
              <th className="px-4 py-3 w-[40px]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-[14px] h-[14px] accent-[#e8607a] cursor-pointer"
                />
              </th>
              {['Companion', 'Slot', 'Community', 'Week', 'Price', 'Status', 'Booked', ''].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] text-[#6b7280] font-medium px-4 py-3 tracking-[0.04em] uppercase"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <tbody key="loading">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid #1c2333',
                      background: i % 2 === 0 ? '#0d1117' : '#07090f',
                    }}
                  >
                    <td className="px-4 py-4 w-[40px]">
                      <div className="w-[14px] h-[14px] rounded bg-[#1c2333] animate-pulse" />
                    </td>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div
                          className="h-[14px] rounded-full bg-[#1c2333] animate-pulse"
                          style={{ width: j === 0 ? 140 : 80 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ) : (
              <motion.tbody
                key={`${statusFilter}-${page}`}
                variants={container}
                initial="hidden"
                animate="show"
              >
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-16"
                      style={{ fontSize: 13, color: '#6b7280' }}
                    >
                      No boosts yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((b, idx) => (
                    <motion.tr
                      key={b.id}
                      variants={cardItem}
                      style={{
                        borderBottom: '1px solid #1c2333',
                        background: selectedIds.has(b.id)
                          ? 'rgba(239,68,68,0.05)'
                          : idx % 2 === 0
                          ? '#0d1117'
                          : '#07090f',
                      }}
                      className="group hover:bg-[#111620] transition-colors"
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4 w-[40px]">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(b.id)}
                          onChange={() => toggleOne(b.id)}
                          className="w-[14px] h-[14px] accent-[#e8607a] cursor-pointer"
                        />
                      </td>
                      {/* Companion */}
                      <td className="px-4 py-4">
                        <div style={{ fontSize: 13, color: '#eeeef0', fontWeight: 500 }}>
                          {b.companion_name ?? '—'}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                          {b.companion_email}
                        </div>
                      </td>
                      {/* Slot type */}
                      <td className="px-4 py-4">
                        <BoostTypeBadge type={b.boost_type} />
                      </td>
                      {/* Community */}
                      <td className="px-4 py-4">
                        <CommunityChip community={b.community} />
                      </td>
                      {/* Week */}
                      <td
                        className="px-4 py-4"
                        style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}
                      >
                        {fmtDate(b.week_start)} – {fmtDate(b.week_end)}
                      </td>
                      {/* Price */}
                      <td className="px-4 py-4">
                        <span style={{ fontSize: 13, color: '#eeeef0', fontWeight: 500 }}>
                          €{parseFloat(b.price_eur).toFixed(2)}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-4">
                        <StatusBadge status={b.status} />
                      </td>
                      {/* Booked at */}
                      <td className="px-4 py-4" style={{ fontSize: 12, color: '#6b7280' }}>
                        {fmtDate(b.created_at)}
                      </td>
                      {/* Cancel */}
                      <td className="px-4 py-4">
                        {b.status === 'active' && (
                          <button
                            onClick={() => cancelMutation.mutate(b.id)}
                            disabled={cancelMutation.isPending}
                            className="flex items-center gap-[5px] opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40"
                            style={{ fontSize: 12, color: '#f87171' }}
                          >
                            <XCircle size={13} />
                            Cancel
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </motion.tbody>
            )}
          </AnimatePresence>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3 mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`mob-${statusFilter}-${page}`}
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3"
          >
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-4 animate-pulse h-[100px]"
                  />
                ))
              : rows.map((b) => (
                  <motion.div
                    key={b.id}
                    variants={cardItem}
                    className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div style={{ fontSize: 13, color: '#eeeef0', fontWeight: 500 }}>
                          {b.companion_name ?? '—'}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                          {b.companion_email}
                        </div>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="flex gap-2 flex-wrap mb-2">
                      <BoostTypeBadge type={b.boost_type} />
                      <CommunityChip community={b.community} />
                      <span
                        style={{
                          fontSize: 11,
                          padding: '3px 10px',
                          borderRadius: 99,
                          color: '#eeeef0',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid #1c2333',
                        }}
                      >
                        €{parseFloat(b.price_eur).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      {fmtDate(b.week_start)} – {fmtDate(b.week_end)}
                    </div>
                    {b.status === 'active' && (
                      <button
                        onClick={() => cancelMutation.mutate(b.id)}
                        disabled={cancelMutation.isPending}
                        className="mt-3 flex items-center gap-1 disabled:opacity-40"
                        style={{ fontSize: 12, color: '#f87171' }}
                      >
                        <XCircle size={13} />
                        Cancel boost
                      </button>
                    )}
                  </motion.div>
                ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#1c2333] text-[#6b7280] disabled:opacity-30 hover:border-[rgba(232,96,122,0.5)] hover:text-[#e8607a] transition-all"
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#1c2333] text-[#6b7280] disabled:opacity-30 hover:border-[rgba(232,96,122,0.5)] hover:text-[#e8607a] transition-all"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* No boosts empty state */}
      {!isLoading && rows.length === 0 && meta?.total === 0 && statusFilter === 'all' && (
        <div
          className="text-center py-16 rounded-[14px] border border-[#1c2333]"
          style={{ background: '#111620' }}
        >
          <LayoutPanelTop size={32} color="#1c2333" className="mx-auto mb-4" />
          <p style={{ fontSize: 14, color: '#6b7280' }}>No ad slots booked yet.</p>
          <p style={{ fontSize: 12, color: '#4b5563', marginTop: 6 }}>
            Companions book these from their dashboard → Boost tab.
          </p>
        </div>
      )}

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="sticky bottom-6 flex items-center gap-3 mt-6 px-4 py-[10px] rounded-[12px] border border-[#1c2333] w-fit mx-auto"
            style={{ background: '#111620', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          >
            <span style={{ fontSize: 13, color: '#eeeef0' }}>
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-[12px] text-[#6b7280] hover:text-[#eeeef0] transition-colors px-3 py-[6px] rounded-[8px] border border-[#1c2333] cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="text-[12px] text-white px-4 py-[6px] rounded-[8px] cursor-pointer font-medium flex items-center gap-[6px] transition-all hover:opacity-90"
              style={{ background: '#ef4444' }}
            >
              <Trash2 size={12} />
              Delete {selectedIds.size} boost{selectedIds.size !== 1 ? 's' : ''}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk delete modal */}
      <AnimatePresence>
        {showBulkModal && (
          <BulkDeleteAdsModal
            key="bulk-delete-ads"
            count={selectedIds.size}
            onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
            onCancel={() => setShowBulkModal(false)}
            isPending={bulkDeleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
