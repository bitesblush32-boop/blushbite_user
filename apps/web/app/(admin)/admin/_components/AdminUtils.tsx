'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

// ─── StatusBadge ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: {
    label: 'Pending',
    color: '#c9a96e',
    bg: 'rgba(201,169,110,0.1)',
    border: 'rgba(201,169,110,0.3)',
  },
  approved: {
    label: 'Approved',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.1)',
    border: 'rgba(74,222,128,0.3)',
  },
  rejected: {
    label: 'Rejected',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.1)',
    border: 'rgba(248,113,113,0.3)',
  },
  accepted: {
    label: 'Accepted',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.1)',
    border: 'rgba(74,222,128,0.3)',
  },
  completed: {
    label: 'Completed',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.1)',
    border: 'rgba(107,114,128,0.3)',
  },
  declined: {
    label: 'Declined',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.1)',
    border: 'rgba(248,113,113,0.3)',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.1)',
    border: 'rgba(107,114,128,0.3)',
  },
  active: {
    label: 'Active',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.1)',
    border: 'rgba(74,222,128,0.3)',
  },
  inactive: {
    label: 'Inactive',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.1)',
    border: 'rgba(107,114,128,0.3)',
  },
  live: {
    label: 'Live',
    color: '#e8607a',
    bg: 'rgba(232,96,122,0.1)',
    border: 'rgba(232,96,122,0.3)',
  },
  draft: {
    label: 'Draft',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.1)',
    border: 'rgba(107,114,128,0.3)',
  },
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? {
    label: status,
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.1)',
    border: 'rgba(107,114,128,0.3)',
  }
  return (
    <span
      style={{
        fontSize: 11,
        padding: '3px 10px',
        borderRadius: 99,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  )
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  confirmColor = '#e8607a',
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  confirmColor?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[900] flex items-center justify-center px-5"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[400px] rounded-[16px] overflow-hidden"
            style={{ background: '#0d1117', border: '1px solid #1c2333' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="h-[2px]"
              style={{
                background: `linear-gradient(90deg,transparent,${confirmColor},transparent)`,
              }}
            />
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <p style={{ fontSize: 16, fontWeight: 600, color: '#eeeef0' }}>{title}</p>
                <button
                  onClick={onCancel}
                  className="w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0 ml-3 transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
                  }}
                >
                  <X size={14} />
                </button>
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>
                {body}
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="transition-all duration-150"
                  style={{
                    background: 'transparent',
                    border: '1px solid #1c2333',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontSize: 13,
                    color: '#6b7280',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.borderColor = '#1c2333'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  style={{
                    background: confirmColor,
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#fff',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    minWidth: 80,
                  }}
                >
                  {loading ? '…' : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({
  h = 40,
  w,
  rounded = 8,
}: {
  h?: number
  w?: number | string
  rounded?: number
}) {
  return (
    <div
      className="animate-pulse"
      style={{
        height: h,
        width: w ?? '100%',
        borderRadius: rounded,
        background: '#1c2333',
      }}
    />
  )
}

// ─── formatRelativeTime ───────────────────────────────────────────────────────

export function formatRelativeTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—'
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── AdminPageHeader ──────────────────────────────────────────────────────────

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
      <div>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 26,
            color: '#eeeef0',
            marginBottom: 4,
          }}
        >
          {title}
        </h1>
        {subtitle && <p style={{ fontSize: 13, color: '#6b7280' }}>{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
