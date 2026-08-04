'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings2, Globe, ShieldAlert } from 'lucide-react'
import { AdminPageHeader, Skeleton } from '../_components/AdminUtils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlatformSettings {
  female_enabled: boolean
  male_enabled: boolean
}

// ─── Community toggle card ─────────────────────────────────────────────────────

function CommunityToggle({
  label,
  description,
  enabled,
  color,
  onChange,
  disabled,
}: {
  label: string
  description: string
  enabled: boolean
  color: string
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-[14px] p-5 transition-all duration-150"
      style={{
        background: enabled ? `${color}08` : '#0d1117',
        border: `1px solid ${enabled ? `${color}30` : '#1c2333'}`,
      }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="w-[40px] h-[40px] rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: enabled ? `${color}18` : 'rgba(255,255,255,0.04)' }}
        >
          <Globe size={18} color={enabled ? color : '#4b5563'} />
        </div>
        <div className="min-w-0">
          <p style={{ fontSize: 14, fontWeight: 600, color: '#eeeef0', marginBottom: 2 }}>
            {label}
          </p>
          <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{description}</p>
        </div>
      </div>

      {/* Toggle pill */}
      <button
        onClick={() => onChange(!enabled)}
        disabled={disabled}
        aria-label={`${enabled ? 'Disable' : 'Enable'} ${label} community`}
        className="flex-shrink-0 relative transition-all duration-200 disabled:opacity-50"
        style={{
          width: 44,
          height: 24,
          borderRadius: 99,
          background: enabled ? color : '#1c2333',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: 0,
        }}
      >
        <span
          className="absolute top-[3px] transition-all duration-200"
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            left: enabled ? 23 : 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}
        />
      </button>
    </div>
  )
}

// ─── Section card wrapper ──────────────────────────────────────────────────────

function SettingCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-[16px] overflow-hidden"
      style={{ background: '#111620', border: '1px solid #1c2333' }}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1c2333]">
        <div
          className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(232,96,122,0.1)' }}
        >
          <Icon size={17} color="#e8607a" />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#eeeef0' }}>{title}</p>
          <p style={{ fontSize: 12, color: '#6b7280' }}>{subtitle}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<Partial<PlatformSettings>>({})
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery<{ data: PlatformSettings }>({
    queryKey: ['admin', 'boost-settings'],
    queryFn: () => fetch('/api/admin/boost-settings').then((r) => r.json()),
  })

  const saveMutation = useMutation({
    mutationFn: async (patch: Partial<PlatformSettings>) => {
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
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const settings = data?.data
  const merged: PlatformSettings = {
    female_enabled: draft.female_enabled ?? settings?.female_enabled ?? true,
    male_enabled: draft.male_enabled ?? settings?.male_enabled ?? true,
  }

  const hasDraft = Object.keys(draft).length > 0

  const COMMUNITIES = [
    {
      key: 'female_enabled' as const,
      label: 'Female community',
      description: 'Show the female companion community on blushbite.co and blushbite.live. When disabled, all /female traffic redirects to /shemale.',
      color: '#e8607a',
    },
    {
      key: 'male_enabled' as const,
      label: 'Male community',
      description: 'Show the male companion community on blushbite.co and blushbite.live. When disabled, all /male traffic redirects to /shemale.',
      color: '#60a5fa',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="p-6 md:p-10 min-h-screen"
      style={{ background: '#07090f' }}
    >
      {/* Noise texture */}
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-[720px]">
        <AdminPageHeader
          title="Platform Settings"
          subtitle="Control global platform behaviour — community access, routing, and visibility."
        />

        <div className="flex flex-col gap-6">
          {/* Community Access */}
          <SettingCard
            icon={Settings2}
            title="Community Access"
            subtitle="Enable or disable gender communities site-wide"
          >
            {isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton h={74} />
                <Skeleton h={74} />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {COMMUNITIES.map(({ key, label, description, color }) => (
                  <CommunityToggle
                    key={key}
                    label={label}
                    description={description}
                    enabled={merged[key]}
                    color={color}
                    onChange={(v) => setDraft((p) => ({ ...p, [key]: v }))}
                    disabled={saveMutation.isPending}
                  />
                ))}

                {/* Shemale — always on notice */}
                <div
                  className="flex items-start gap-3 rounded-[12px] p-4 mt-1"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1c2333' }}
                >
                  <ShieldAlert size={15} color="#4b5563" className="flex-shrink-0 mt-[1px]" />
                  <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.6 }}>
                    The <span style={{ color: '#9b5fe0' }}>TS / Shemale</span> community is always
                    active and cannot be disabled. Disabled communities redirect here.
                  </p>
                </div>
              </div>
            )}

            {/* Save bar */}
            <div className="flex items-center justify-between gap-4 mt-6 pt-5 border-t border-[#1c2333]">
              {saved && !hasDraft ? (
                <p style={{ fontSize: 13, color: '#4ade80' }}>✓ Changes saved</p>
              ) : (
                <p style={{ fontSize: 12, color: '#4b5563' }}>
                  {hasDraft ? 'You have unsaved changes.' : 'No pending changes.'}
                </p>
              )}
              <button
                onClick={() => saveMutation.mutate(draft)}
                disabled={saveMutation.isPending || !hasDraft}
                className="transition-all duration-150"
                style={{
                  background: hasDraft ? '#e8607a' : 'rgba(255,255,255,0.05)',
                  border: hasDraft ? 'none' : '1px solid #1c2333',
                  borderRadius: 10,
                  padding: '9px 22px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: hasDraft ? '#fff' : '#4b5563',
                  cursor: hasDraft && !saveMutation.isPending ? 'pointer' : 'not-allowed',
                  opacity: saveMutation.isPending ? 0.7 : 1,
                  minHeight: 44,
                  minWidth: 100,
                }}
              >
                {saveMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </SettingCard>
        </div>
      </div>
    </motion.div>
  )
}
