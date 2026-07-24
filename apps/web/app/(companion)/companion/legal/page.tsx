'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

const DOCS = [
  {
    key: 'tos',
    label: 'Terms of Service',
    description:
      'I have read and agree to the BlushBite Terms of Service, including platform conduct rules, content standards, and compensation terms.',
  },
  {
    key: 'model_release',
    label: 'Model Release Agreement',
    description:
      'I consent to the use of content I create on this platform in accordance with the Model Release Agreement, including distribution rights and licensing terms.',
  },
  {
    key: 'form_2257',
    label: '18 U.S.C. § 2257 Compliance',
    description:
      'I confirm that I am 18 years of age or older, and that all records required by 18 U.S.C. § 2257 are maintained and available for inspection.',
  },
]

export default function CompanionLegalPage() {
  const router = useRouter()
  const { update } = useSession()
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const allChecked = DOCS.every((d) => checked[d.key])

  const toggle = (key: string) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleSign = async () => {
    if (!allChecked || saving) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/companion/legal/sign', { method: 'POST' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Something went wrong.')
      }
      await update()
      router.push('/')
    } catch (err) {
      setSaving(false)
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again in a moment.')
    }
  }

  return (
    <div className="min-h-screen bg-[#07090f] flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
      {/* Noise texture */}
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient rose glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[540px] relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo_light.png"
            alt="BlushBite"
            width={120}
            height={48}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>

        {/* Card */}
        <div
          className="rounded-[20px] border border-[#1c2333] overflow-hidden"
          style={{ background: '#0d1117' }}
        >
          {/* Top accent line */}
          <div
            className="h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, #e8607a, transparent)' }}
          />

          <div className="p-8">
            {/* Header */}
            <div className="mb-7">
              <p className="text-[10px] text-[#e8607a] uppercase tracking-[0.1em] mb-3">
                Almost there
              </p>
              <h2
                className="text-[26px] text-[#eeeef0] mb-2 leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Before you enter{' '}
                <em style={{ fontStyle: 'italic', color: '#e8607a' }}>the room.</em>
              </h2>
              <p className="text-[13px] text-[#6b7280] leading-[1.65]">
                A few agreements keep this space safe for everyone in it — including you. Read each
                one and confirm your understanding below.
              </p>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-col gap-4 mb-7">
              {DOCS.map((doc, i) => {
                const isChecked = !!checked[doc.key]
                return (
                  <motion.button
                    key={doc.key}
                    onClick={() => toggle(doc.key)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="text-left rounded-[12px] p-4 cursor-pointer transition-all duration-200 flex gap-4 items-start"
                    style={{
                      background: isChecked ? 'rgba(232,96,122,0.06)' : '#161d2a',
                      border: isChecked ? '1px solid rgba(232,96,122,0.35)' : '1px solid #1c2333',
                    }}
                  >
                    {/* Checkbox indicator */}
                    <div
                      className="flex-shrink-0 w-5 h-5 rounded-[5px] border flex items-center justify-center mt-[1px] transition-all duration-150"
                      style={{
                        background: isChecked ? '#e8607a' : 'transparent',
                        borderColor: isChecked ? '#e8607a' : '#1c2333',
                      }}
                    >
                      {isChecked && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path
                            d="M1 4L3.5 6.5L9 1"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>

                    <div>
                      <div className="text-[13.5px] font-medium text-[#eeeef0] mb-[5px]">
                        {doc.label}
                      </div>
                      <div className="text-[12px] text-[#6b7280] leading-[1.55]">
                        {doc.description}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* CTA */}
            <button
              onClick={allChecked && !saving ? handleSign : undefined}
              disabled={!allChecked || saving}
              className="w-full py-[13px] rounded-[10px] text-[14px] font-medium transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: allChecked && !saving ? '#e8607a' : '#161d2a',
                color: allChecked && !saving ? '#fff' : '#6b7280',
                border: allChecked && !saving ? 'none' : '1px solid #1c2333',
                boxShadow: allChecked && !saving ? '0 6px 20px rgba(232,96,122,0.22)' : 'none',
                cursor: !allChecked || saving ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (allChecked && !saving) {
                  ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'none'
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Entering the room…
                </>
              ) : (
                'I agree — enter the room →'
              )}
            </button>

            {/* Error */}
            {error && (
              <div
                className="mt-4 px-3 py-2 rounded-[8px] text-[12px] text-[#e8607a] text-center"
                style={{
                  background: 'rgba(232,96,122,0.08)',
                  border: '1px solid rgba(232,96,122,0.25)',
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-[#6b7280] mt-5" style={{ opacity: 0.5 }}>
          Your identity stays private — always. These agreements are stored securely.
        </p>
      </motion.div>
    </div>
  )
}
