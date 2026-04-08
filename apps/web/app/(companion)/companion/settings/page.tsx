'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, AlertTriangle, Check, FileText, Shield } from 'lucide-react'

interface LegalDoc {
  document_type: 'tos' | 'model_release' | 'form_2257'
  signed_at: string
}

interface SettingsData {
  email: string
  alias: string
  has_password: boolean
  legal_docs: LegalDoc[]
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type PasswordForm = z.infer<typeof passwordSchema>

const DOC_LABELS: Record<string, string> = {
  tos:            'Terms of Service',
  model_release:  'Model Release',
  form_2257:      '2257 Age Declaration',
}

function formatDocDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function ReadonlyField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] text-[#6b7280] uppercase tracking-[0.06em] mb-[6px]">{label}</label>
      <div
        className="flex items-center gap-2 px-[14px] py-[10px] rounded-[10px] border border-[#1c2333] text-[13.5px] text-[#6b7280]"
        style={{ background: '#0d1117' }}
      >
        {icon}
        <span>{value}</span>
        <Lock size={12} className="ml-auto text-[#1c2333]" />
      </div>
    </div>
  )
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-[#111620] border border-[#1c2333] rounded-[16px] p-6 ${className}`}
    >
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading]   = useState(true)

  // Password section
  const [pwSaving, setPwSaving]   = useState(false)
  const [pwSaved, setPwSaved]     = useState(false)
  const [pwError, setPwError]     = useState<string | null>(null)

  // Deactivate modal
  const [showDeactivate, setShowDeactivate]   = useState(false)
  const [deactivating, setDeactivating]       = useState(false)
  const [deactivated, setDeactivated]         = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  useEffect(() => {
    fetch('/api/companions/settings')
      .then(r => r.json())
      .then(d => setSettings(d))
      .finally(() => setLoading(false))
  }, [])

  async function onPasswordSubmit(data: PasswordForm) {
    setPwSaving(true)
    setPwError(null)
    try {
      const res = await fetch('/api/companions/settings/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setPwError(json.error ?? 'Something went wrong')
        return
      }
      setPwSaved(true)
      reset()
      setTimeout(() => setPwSaved(false), 3000)
    } finally {
      setPwSaving(false)
    }
  }

  async function handleDeactivate() {
    setDeactivating(true)
    try {
      await fetch('/api/companions/settings/deactivate', { method: 'PATCH' })
      setDeactivated(true)
      setShowDeactivate(false)
    } finally {
      setDeactivating(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-[680px] mx-auto px-5 md:px-10 py-8 flex flex-col gap-4">
        {[0, 1].map(i => (
          <div key={i} className="bg-[#111620] border border-[#1c2333] rounded-[16px] h-[200px] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-[680px] mx-auto px-5 md:px-10 py-8 relative">
      {/* Noise */}
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)' }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <h1
          className="text-[28px] text-[#eeeef0] mb-1"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Account settings
        </h1>
        <p className="text-[12px] text-[#6b7280]">Manage your identity, security, and standing.</p>
      </motion.div>

      <div className="flex flex-col gap-6">

        {/* ── SECTION A: Account ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionCard>
            <div className="flex items-center gap-2 mb-5">
              <Shield size={14} className="text-[#e8607a]" />
              <span className="text-[13px] font-medium text-[#eeeef0]">Account</span>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <ReadonlyField label="Email address" value={settings?.email ?? ''} />
              <div>
                <ReadonlyField label="Your alias" value={settings?.alias ?? ''} />
                <p className="text-[11px] text-[#6b7280] mt-[6px] pl-1">
                  Your alias is permanent.{' '}
                  <a href="mailto:support@blushbite.com" className="text-[#e8607a] opacity-80 hover:opacity-100 transition-opacity">
                    Contact support
                  </a>{' '}
                  if you need it changed.
                </p>
              </div>
            </div>

            {/* Password change — only if has_password */}
            {settings?.has_password && (
              <div className="border-t border-[#1c2333] pt-5">
                <p className="text-[12px] text-[#6b7280] mb-4">
                  Change your password
                </p>
                <form onSubmit={handleSubmit(onPasswordSubmit)} className="flex flex-col gap-3">
                  <div>
                    <input
                      type="password"
                      placeholder="Current password"
                      {...register('currentPassword')}
                      className="w-full px-[14px] py-[10px] rounded-[10px] border border-[#1c2333] bg-[#0d1117] text-[13px] text-[#eeeef0] placeholder-[#6b7280] outline-none focus:border-[#e8607a] transition-colors"
                    />
                    {errors.currentPassword && (
                      <p className="text-[11px] text-[#e8607a] mt-1">{errors.currentPassword.message}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="New password"
                      {...register('newPassword')}
                      className="w-full px-[14px] py-[10px] rounded-[10px] border border-[#1c2333] bg-[#0d1117] text-[13px] text-[#eeeef0] placeholder-[#6b7280] outline-none focus:border-[#e8607a] transition-colors"
                    />
                    {errors.newPassword && (
                      <p className="text-[11px] text-[#e8607a] mt-1">{errors.newPassword.message}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      {...register('confirmPassword')}
                      className="w-full px-[14px] py-[10px] rounded-[10px] border border-[#1c2333] bg-[#0d1117] text-[13px] text-[#eeeef0] placeholder-[#6b7280] outline-none focus:border-[#e8607a] transition-colors"
                    />
                    {errors.confirmPassword && (
                      <p className="text-[11px] text-[#e8607a] mt-1">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {pwError && (
                    <p className="text-[12px] text-[#e8607a] px-1">{pwError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={pwSaving || pwSaved}
                    className="flex items-center justify-center gap-2 bg-[#e8607a] hover:bg-[#c4485e] text-white border-none px-[22px] py-[11px] rounded-[10px] text-[13px] font-medium cursor-pointer transition-all duration-200 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                  >
                    {pwSaving ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : pwSaved ? (
                      <><Check size={13} /> Password updated</>
                    ) : (
                      'Update password'
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Deactivate */}
            <div className="border-t border-[#1c2333] mt-6 pt-5">
              {deactivated ? (
                <div
                  className="flex items-center gap-2 text-[12.5px] px-4 py-3 rounded-[10px]"
                  style={{ background: 'rgba(232,96,122,0.08)', border: '1px solid rgba(232,96,122,0.2)' }}
                >
                  <AlertTriangle size={13} className="text-[#e8607a]" />
                  <span className="text-[#e8607a]">
                    Your profile has been deactivated. New bookings are paused.
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeactivate(true)}
                  className="text-[12px] text-[#6b7280] hover:text-[#e8607a] transition-colors cursor-pointer bg-transparent border-none p-0"
                >
                  Deactivate my profile →
                </button>
              )}
            </div>
          </SectionCard>
        </motion.div>

        {/* ── SECTION B: Legal docs ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionCard>
            <div className="flex items-center gap-2 mb-5">
              <FileText size={14} className="text-[#e8607a]" />
              <span className="text-[13px] font-medium text-[#eeeef0]">Legal documents</span>
            </div>

            {settings?.legal_docs && settings.legal_docs.length > 0 ? (
              <div className="flex flex-col gap-3">
                {(['tos', 'model_release', 'form_2257'] as const).map(docType => {
                  const doc = settings.legal_docs.find(d => d.document_type === docType)
                  return (
                    <div
                      key={docType}
                      className="flex items-center justify-between px-4 py-3 rounded-[10px] border border-[#1c2333]"
                      style={{ background: '#0d1117' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0"
                          style={
                            doc
                              ? { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }
                              : { background: 'rgba(107,114,128,0.1)', border: '1px solid #1c2333' }
                          }
                        >
                          {doc
                            ? <Check size={12} className="text-[#4ade80]" />
                            : <FileText size={12} className="text-[#6b7280]" />
                          }
                        </div>
                        <div>
                          <p className="text-[13px] text-[#eeeef0]">{DOC_LABELS[docType]}</p>
                          {doc && (
                            <p className="text-[11px] text-[#6b7280]">Signed {formatDocDate(doc.signed_at)}</p>
                          )}
                        </div>
                      </div>
                      {doc ? (
                        <span
                          className="text-[11px] px-[8px] py-[3px] rounded-full"
                          style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}
                        >
                          signed
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#6b7280]">pending</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-[13px] text-[#6b7280] italic" style={{ fontFamily: "'Playfair Display', serif" }}>
                No documents on file yet.
              </p>
            )}

            <p className="text-[11px] text-[#6b7280] mt-4 leading-[1.6]">
              All documents are permanently stored and legally binding under EU law.{' '}
              <a href="mailto:legal@blushbite.com" className="text-[#e8607a] opacity-80 hover:opacity-100 transition-opacity">
                Contact legal
              </a>{' '}
              for any queries.
            </p>
          </SectionCard>
        </motion.div>

      </div>

      {/* Deactivate confirmation modal */}
      <AnimatePresence>
        {showDeactivate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-[8px] z-[800] flex items-center justify-center px-5"
            onClick={() => setShowDeactivate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#0d1117] border border-[#1c2333] rounded-[20px] w-full max-w-[420px] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,transparent,#e8607a,transparent)' }} />
              <div className="p-7">
                <div
                  className="w-[44px] h-[44px] rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'rgba(232,96,122,0.12)', border: '1px solid rgba(232,96,122,0.25)' }}
                >
                  <AlertTriangle size={18} className="text-[#e8607a]" />
                </div>
                <h2
                  className="text-[20px] text-[#eeeef0] mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Deactivate your profile?
                </h2>
                <p className="text-[13px] text-[#6b7280] leading-[1.6] mb-6">
                  Your profile will be hidden and no new booking requests will be accepted.
                  You can reactivate at any time by contacting support.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeactivate(false)}
                    className="flex-1 bg-transparent text-[#6b7280] border border-[#1c2333] px-[20px] py-[11px] rounded-[10px] text-[13px] cursor-pointer transition-all duration-200 hover:border-white/20 hover:text-[#eeeef0]"
                  >
                    Keep active
                  </button>
                  <button
                    onClick={handleDeactivate}
                    disabled={deactivating}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#e8607a] hover:bg-[#c4485e] text-white border-none px-[20px] py-[11px] rounded-[10px] text-[13px] font-medium cursor-pointer transition-all duration-200 disabled:opacity-60"
                  >
                    {deactivating ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Yes, deactivate'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
