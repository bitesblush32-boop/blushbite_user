'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone,
  TrendingUp,
  LayoutPanelTop,
  PanelRight,
  ChevronLeft,
  ChevronRight,
  Settings2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface BoostRow {
  id: string
  companion_id: string
  companion_name: string | null
  companion_email: string
  companion_alias: string | null
  slot_type: 'header_banner' | 'right_rail'
  week_start: string
  week_end: string
  status: 'active' | 'cancelled' | 'expired'
  amount_paid: string
  currency: string
  notes: string | null
  created_at: string
}

interface BoostStats {
  header_active: number
  rail_active: number
  revenue_this_week: string
}

interface BoostResponse {
  data: BoostRow[]
  meta: { total: number; page: number; limit: number }
  stats: BoostStats
}

interface SettingRow {
  slot_type: string
  price_per_week: string
  max_slots_per_week: number
  currency: string
  is_active: boolean
}

interface SettingsResponse {
  data: SettingRow[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

function slotLabel(slot: string) {
  return slot === 'header_banner' ? 'Header Banner' : 'Right Rail'
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
    <div
      className="bg-[#111620] border border-[#1c2333] rounded-[16px] p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center flex-shrink-0"
          style={{ background: `${iconColor}18` }}
        >
          <Icon size={16} color={iconColor} />
        </div>
        <span style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 600, color: '#eeeef0', lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: '#6b7280' }}>{sub}</div>}
    </div>
  )
}

function StatusBadge({ status }: { status: BoostRow['status'] }) {
  const cfg = {
    active: { color: '#4ade80', bg: 'rgba(74,222,128,0.10)', border: 'rgba(74,222,128,0.25)', label: 'Active' },
    cancelled: { color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)', label: 'Cancelled' },
    expired: { color: '#6b7280', bg: 'rgba(255,255,255,0.04)', border: '#1c2333', label: 'Expired' },
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

function SlotBadge({ slot }: { slot: string }) {
  const isHeader = slot === 'header_banner'
  return (
    <span
      style={{
        fontSize: 11,
        padding: '3px 10px',
        borderRadius: 99,
        color: isHeader ? '#c9a96e' : '#e8607a',
        background: isHeader ? 'rgba(201,169,110,0.10)' : 'rgba(232,96,122,0.10)',
        border: `1px solid ${isHeader ? 'rgba(201,169,110,0.25)' : 'rgba(232,96,122,0.25)'}`,
      }}
    >
      {slotLabel(slot)}
    </span>
  )
}

// ── Settings panel ─────────────────────────────────────────────────────────────

function SettingsPanel() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Record<string, { price: string; max: string }>>({})

  const { data } = useQuery<SettingsResponse>({
    queryKey: ['admin', 'boost-settings'],
    queryFn: () => fetch('/api/admin/boost-settings').then((r) => r.json()),
  })

  const saveMutation = useMutation({
    mutationFn: async ({ slot_type, price_per_week, max_slots_per_week }: {
      slot_type: string
      price_per_week: number
      max_slots_per_week: number
    }) => {
      const res = await fetch('/api/admin/boost-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_type, price_per_week, max_slots_per_week }),
      })
      if (!res.ok) throw new Error('Failed to save')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'boost-settings'] })
      setEditing({})
    },
  })

  const rows = data?.data ?? []

  return (
    <div
      className="border border-[#1c2333] rounded-[16px] overflow-hidden"
      style={{ background: '#111620' }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-left transition-colors"
        style={{ background: open ? 'rgba(255,255,255,0.02)' : 'transparent' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = open ? 'rgba(255,255,255,0.02)' : 'transparent' }}
      >
        <div className="flex items-center gap-3">
          <Settings2 size={16} color="#6b7280" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#eeeef0' }}>Slot Settings</span>
          <span style={{ fontSize: 12, color: '#6b7280' }}>— pricing & capacity per slot type</span>
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
              {rows.length === 0 ? (
                <p style={{ fontSize: 13, color: '#6b7280' }}>No settings found in DB.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {rows.map((row) => {
                    const e = editing[row.slot_type]
                    const price = e?.price ?? row.price_per_week
                    const max = e?.max ?? String(row.max_slots_per_week)
                    return (
                      <div
                        key={row.slot_type}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-[12px] border border-[#1c2333]"
                        style={{ background: '#0d1117' }}
                      >
                        <div className="flex-1">
                          <SlotBadge slot={row.slot_type} />
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex flex-col gap-1">
                            <label style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Price / week ({row.currency})
                            </label>
                            <input
                              type="number"
                              value={price}
                              onChange={(ev) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [row.slot_type]: { price: ev.target.value, max: prev[row.slot_type]?.max ?? String(row.max_slots_per_week) },
                                }))
                              }
                              className="w-[120px] bg-[#111620] border border-[#1c2333] rounded-[8px] px-3 py-[8px] text-[13px] text-[#eeeef0] outline-none focus:border-[rgba(232,96,122,0.5)]"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Max slots / week
                            </label>
                            <input
                              type="number"
                              value={max}
                              onChange={(ev) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [row.slot_type]: { price: prev[row.slot_type]?.price ?? row.price_per_week, max: ev.target.value },
                                }))
                              }
                              className="w-[100px] bg-[#111620] border border-[#1c2333] rounded-[8px] px-3 py-[8px] text-[13px] text-[#eeeef0] outline-none focus:border-[rgba(232,96,122,0.5)]"
                            />
                          </div>
                          <button
                            onClick={() =>
                              saveMutation.mutate({
                                slot_type: row.slot_type,
                                price_per_week: parseFloat(price),
                                max_slots_per_week: parseInt(max),
                              })
                            }
                            disabled={saveMutation.isPending}
                            className="mt-4 sm:mt-0 self-end bg-[#e8607a] hover:bg-[#c4485e] text-white border-none px-4 py-[9px] rounded-[8px] text-[13px] font-medium cursor-pointer transition-all disabled:opacity-60"
                          >
                            {saveMutation.isPending ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Status filter tabs ─────────────────────────────────────────────────────────

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
  const queryClient = useQueryClient()

  const queryKey = ['admin', 'boosts', statusFilter, page]

  const { data, isLoading } = useQuery<BoostResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ status: statusFilter, page: String(page), limit: '20' })
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

  const rows = data?.data ?? []
  const meta = data?.meta
  const stats = data?.stats
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="p-6 md:p-10 min-h-screen"
      style={{ background: '#07090f' }}
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#eeeef0', marginBottom: 4 }}
          >
            Ad Slots
          </h1>
          <p style={{ fontSize: 12, color: '#6b7280' }}>
            Companion boost bookings — header banner & right rail placements
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-[#111620] border border-[#1c2333] rounded-[16px] h-[110px] animate-pulse" />
            ))}
          </>
        ) : (
          <>
            <KpiTile
              icon={Megaphone}
              iconColor="#e8607a"
              label="Header Slots (this week)"
              value={`${stats?.header_active ?? 0} / ${data?.data ? '3' : '—'}`}
              sub="active header_banner boosts"
            />
            <KpiTile
              icon={PanelRight}
              iconColor="#c9a96e"
              label="Right Rail (this week)"
              value={`${stats?.rail_active ?? 0} / ${data?.data ? '3' : '—'}`}
              sub="active right_rail boosts"
            />
            <KpiTile
              icon={TrendingUp}
              iconColor="#4ade80"
              label="Revenue this week"
              value={`€${parseFloat(stats?.revenue_this_week ?? '0').toFixed(2)}`}
              sub="from active boosts"
            />
            <KpiTile
              icon={LayoutPanelTop}
              iconColor="#6b7280"
              label="Total Boosts"
              value={meta?.total ?? 0}
              sub="all time"
            />
          </>
        )}
      </div>

      {/* Settings panel */}
      <div className="mb-8">
        <SettingsPanel />
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
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

      {/* Desktop table */}
      <div className="hidden md:block rounded-[14px] overflow-hidden border border-[#1c2333] mb-6">
        <table className="w-full">
          <thead>
            <tr style={{ background: '#111620', borderBottom: '1px solid #1c2333' }}>
              {['Companion', 'Slot Type', 'Week', 'Amount', 'Status', 'Booked', ''].map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] text-[#6b7280] font-medium px-4 py-3 tracking-[0.04em] uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <tbody key="loading">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1c2333', background: i % 2 === 0 ? '#0d1117' : '#07090f' }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-[14px] rounded-full bg-[#1c2333] animate-pulse" style={{ width: j === 0 ? 140 : 80 }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ) : (
              <motion.tbody key={`${statusFilter}-${page}`} variants={container} initial="hidden" animate="show">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16" style={{ fontSize: 13, color: '#6b7280' }}>
                      No boosts yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((b, idx) => (
                    <motion.tr
                      key={b.id}
                      variants={cardItem}
                      style={{ borderBottom: '1px solid #1c2333', background: idx % 2 === 0 ? '#0d1117' : '#07090f' }}
                      className="group hover:bg-[#111620] transition-colors"
                    >
                      {/* Companion */}
                      <td className="px-4 py-4">
                        <div style={{ fontSize: 13, color: '#eeeef0', fontWeight: 500 }}>
                          {b.companion_name ?? b.companion_alias ?? '—'}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{b.companion_email}</div>
                        {b.companion_alias && (
                          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{b.companion_alias}</div>
                        )}
                      </td>
                      {/* Slot */}
                      <td className="px-4 py-4">
                        <SlotBadge slot={b.slot_type} />
                      </td>
                      {/* Week */}
                      <td className="px-4 py-4" style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {fmtDate(b.week_start)} → {fmtDate(b.week_end)}
                      </td>
                      {/* Amount */}
                      <td className="px-4 py-4">
                        <span style={{ fontSize: 13, color: '#eeeef0', fontWeight: 500 }}>
                          {b.currency} {parseFloat(b.amount_paid).toFixed(2)}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-4">
                        <StatusBadge status={b.status} />
                      </td>
                      {/* Booked */}
                      <td className="px-4 py-4" style={{ fontSize: 12, color: '#6b7280' }}>
                        {fmtDate(b.created_at)}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-4">
                        {b.status === 'active' && (
                          <button
                            onClick={() => cancelMutation.mutate(b.id)}
                            disabled={cancelMutation.isPending}
                            className="flex items-center gap-[5px] opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40"
                            style={{ fontSize: 12, color: '#f87171' }}
                            title="Cancel this boost"
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
                  <div key={i} className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-4 animate-pulse h-[100px]" />
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
                          {b.companion_name ?? b.companion_alias ?? '—'}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{b.companion_email}</div>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="flex gap-2 flex-wrap mb-3">
                      <SlotBadge slot={b.slot_type} />
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, color: '#eeeef0', background: 'rgba(255,255,255,0.04)', border: '1px solid #1c2333' }}>
                        {b.currency} {parseFloat(b.amount_paid).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      {fmtDate(b.week_start)} → {fmtDate(b.week_end)}
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
          <span style={{ fontSize: 12, color: '#6b7280' }}>{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#1c2333] text-[#6b7280] disabled:opacity-30 hover:border-[rgba(232,96,122,0.5)] hover:text-[#e8607a] transition-all"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </motion.div>
  )
}
