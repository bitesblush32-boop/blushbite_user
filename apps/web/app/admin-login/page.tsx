'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Eye, EyeOff, Lock } from 'lucide-react'

function AdminLoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const from         = searchParams.get('from') ?? '/admin'

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  // If already logged in, go straight to admin
  useEffect(() => {
    fetch('/api/admin/stats/counts', { method: 'GET' })
      .then(r => { if (r.ok) router.replace(from) })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })

      if (res.ok) {
        router.push(from)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Login failed. Check your credentials.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
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
          background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(232,96,122,0.05) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px] relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/logo_light.png" alt="BlushBite" width={100} height={30} />
        </div>

        {/* Card */}
        <div
          className="rounded-[20px] overflow-hidden"
          style={{ background: '#0d1117', border: '1px solid #1c2333' }}
        >
          {/* Top accent */}
          <div
            className="h-[2px]"
            style={{ background: 'linear-gradient(90deg,transparent,#e8607a,transparent)' }}
          />

          <div className="p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(232,96,122,0.1)', border: '1px solid rgba(232,96,122,0.2)' }}
              >
                <Lock size={16} color="#e8607a" />
              </div>
              <div>
                <h1
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#eeeef0', lineHeight: 1.2 }}
                >
                  Admin access
                </h1>
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>BlushBite control panel</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email */}
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@blushbite.co"
                  required
                  inputMode="email"
                  autoComplete="email"
                  className="w-full rounded-[10px] px-4 py-[12px] text-[13px] outline-none transition-colors"
                  style={{
                    background:  '#111620',
                    border:      '1px solid #1c2333',
                    color:       '#eeeef0',
                    fontSize:    14,
                  }}
                  onFocus={e  => { e.currentTarget.style.borderColor = 'rgba(232,96,122,0.5)' }}
                  onBlur={e   => { e.currentTarget.style.borderColor = '#1c2333' }}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-[10px] pl-4 pr-[44px] py-[12px] text-[13px] outline-none transition-colors"
                    style={{
                      background: '#111620',
                      border:     '1px solid #1c2333',
                      color:      '#eeeef0',
                      fontSize:   14,
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(232,96,122,0.5)' }}
                    onBlur={e  => { e.currentTarget.style.borderColor = '#1c2333' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-[30px] h-[30px] flex items-center justify-center rounded-full transition-colors"
                    style={{ color: '#6b7280' }}
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[12px] text-center"
                  style={{ color: '#f87171' }}
                >
                  {error}
                </motion.p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-[13px] rounded-[10px] text-[13.5px] font-medium text-white transition-all duration-200 mt-2 disabled:opacity-60"
                style={{ background: loading ? '#c4485e' : '#e8607a' }}
              >
                {loading ? 'Signing in…' : 'Sign in to admin'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6" style={{ fontSize: 11, color: '#374151' }}>
          BlushBite · Admin panel · Access restricted
        </p>
      </motion.div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  )
}
