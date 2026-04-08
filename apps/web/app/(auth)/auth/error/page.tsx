'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

const ERROR_MESSAGES: Record<string, string> = {
  Configuration:   "There's a problem with our sign-in configuration. Please try again shortly.",
  AccessDenied:    "Access was denied. You may not have permission to sign in.",
  Verification:    "The sign-in link has expired or has already been used.",
  OAuthSignin:     "Something went wrong starting the sign-in flow. Please try again.",
  OAuthCallback:   "Something went wrong during the sign-in callback. Please try again.",
  OAuthCreateAccount: "We couldn't create your account. Please try a different sign-in method.",
  EmailCreateAccount: "We couldn't create your account with that email.",
  Callback:        "Something went wrong during sign-in. Please try again.",
  OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
  SessionRequired: "You need to be signed in to access this page.",
  Default:         "An unexpected error occurred. Please try again.",
}

function ErrorContent() {
  const params = useSearchParams()
  const error  = params.get('error') ?? 'Default'
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5"
      style={{ background: '#07090f' }}
    >
      {/* Noise */}
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }}
      />
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)' }}
      />

      <div
        className="relative w-full max-w-[420px] rounded-[20px] overflow-hidden"
        style={{ background: '#0d1117', border: '1px solid #1c2333' }}
      >
        {/* Top accent line */}
        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,transparent,#e8607a,transparent)' }} />

        <div className="p-8 text-center">
          {/* Icon */}
          <div
            className="w-[56px] h-[56px] rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(232,96,122,0.12)', border: '1px solid rgba(232,96,122,0.25)' }}
          >
            <span style={{ fontSize: 22 }}>✕</span>
          </div>

          <h1
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#eeeef0', marginBottom: 8 }}
          >
            Sign-in failed
          </h1>

          <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 6 }}>
            {message}
          </p>

          {error !== 'Default' && (
            <p style={{ fontSize: 11, color: '#1c2333', marginBottom: 24 }}>
              Error code: {error}
            </p>
          )}

          <div className="flex flex-col gap-3 mt-6">
            <Link
              href="/auth/signin"
              className="block w-full py-[12px] rounded-[10px] text-[13.5px] font-medium text-white text-center transition-all duration-200 hover:-translate-y-px"
              style={{ background: '#e8607a' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#c4485e' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#e8607a' }}
            >
              Try again
            </Link>
            <Link
              href="/"
              className="block w-full py-[11px] rounded-[10px] text-[13px] text-center transition-all duration-200"
              style={{ background: 'transparent', border: '1px solid #1c2333', color: '#6b7280' }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(255,255,255,0.15)'
                el.style.color = '#eeeef0'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = '#1c2333'
                el.style.color = '#6b7280'
              }}
            >
              Return home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  )
}
