'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { PlusCircle, Menu, X } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

export default function Header() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [plusHover, setPlusHover] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const avatarUrl = useUIStore(s => s.avatarUrl)
  const router = useRouter()
  const pathname = usePathname()
  const isProfile = pathname === '/profile'

  const alias = session?.user?.alias ?? '??'
  const initials = alias.replace('@', '').slice(0, 2).toUpperCase()

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <header
      className="bb-header fixed top-0 left-0 right-0 z-[900] border-b border-[#1c2333]"
      style={{
        background: 'rgba(7,9,15,0.82)',
        backdropFilter: 'blur(20px)',
        willChange: 'transform',
        height: 75,
      }}
    >
      {/* Three-zone grid: left | center | right */}
      <div
        className="px-5 md:px-8"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        {/* LEFT — compose button */}
        <div style={{ justifySelf: 'start' }}>
          <button
            type="button"
            aria-label="Write a confession"
            onClick={() => router.push('/create')}
            onMouseEnter={() => setPlusHover(true)}
            onMouseLeave={() => setPlusHover(false)}
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: plusHover ? 'rgba(232,96,122,0.10)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <PlusCircle
              size={22}
              strokeWidth={1.5}
              color={plusHover ? '#e8607a' : '#6b7280'}
              style={{ transition: 'color 0.15s' }}
            />
          </button>
        </div>

        {/* CENTER — logo */}
        <div style={{ justifySelf: 'center' }}>
          <Link href="/" className="flex-shrink-0 block">
            <Image
              src="/bb.png"
              alt="BlushBite"
              width={80}
              height={44}
              priority
              style={{ objectFit: 'contain', objectPosition: 'center', display: 'block' }}
            />
          </Link>
        </div>

        {/* RIGHT — hamburger on /profile, user pill everywhere else */}
        <div style={{ justifySelf: 'end' }}>
          {isProfile ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(v => !v)}
                className="flex items-center justify-center rounded-full transition-all duration-150"
                style={{
                  width: 40, height: 40, background: 'transparent', border: 'none',
                  color: menuOpen ? '#e8607a' : '#6b7280', cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,96,122,0.10)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                {menuOpen
                  ? <X size={22} strokeWidth={1.5} />
                  : <Menu size={22} strokeWidth={1.5} />
                }
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+10px)] z-10 flex flex-col gap-[2px] rounded-[14px] border border-[#1c2333] bg-[#161d2a] p-2"
                  style={{ minWidth: 180, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
                >
                  <Link
                    href="/privacy"
                    role="menuitem"
                    className="rounded-[8px] px-3 py-2 text-left text-[13px] text-[#6b7280] transition-colors hover:bg-white/[0.06] hover:text-[#eeeef0]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Privacy &amp; safety
                  </Link>
                  <Link
                    href="/help"
                    role="menuitem"
                    className="rounded-[8px] px-3 py-2 text-left text-[13px] text-[#6b7280] transition-colors hover:bg-white/[0.06] hover:text-[#eeeef0]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Help &amp; support
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="rounded-[8px] px-3 py-2 text-left text-[13px] transition-colors hover:bg-white/[0.06]"
                    style={{ color: '#e87070' }}
                    onClick={() => {
                      setMenuOpen(false)
                      signOut({ callbackUrl: '/auth/signin' })
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div ref={menuRef} className="relative flex-shrink-0">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(open => !open)}
                className="flex items-center gap-2 bg-[#111620] border border-[#1c2333] py-[6px] pl-2 pr-[14px] rounded-[24px] cursor-pointer transition-colors duration-200 hover:border-[#e8607a]"
              >
                {avatarUrl ? (
                  <div
                    className="w-[26px] h-[26px] rounded-full flex-shrink-0"
                    style={{
                      backgroundImage: `url(${avatarUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                ) : (
                  <div
                    className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#e8607a,#9b5fe0)' }}
                  >
                    {initials}
                  </div>
                )}
                <span className="hidden md:inline text-[12px] text-[#6b7280]">{alias}</span>
                <span className="ml-1 text-[12px] text-[#6b7280]">{menuOpen ? '▴' : '▾'}</span>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+10px)] z-10 flex w-[180px] flex-col gap-[2px] rounded-[14px] border border-[#1c2333] bg-[#161d2a] p-2"
                  style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
                >
                  <Link
                    href="/profile"
                    role="menuitem"
                    className="rounded-[8px] px-3 py-2 text-left text-[13px] text-[#6b7280] transition-colors duration-150 hover:bg-white/[0.06] hover:text-[#eeeef0]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile &amp; Preferences
                  </Link>
                  <Link
                    href="/privacy"
                    role="menuitem"
                    className="rounded-[8px] px-3 py-2 text-left text-[13px] text-[#6b7280] transition-colors duration-150 hover:bg-white/[0.06] hover:text-[#eeeef0]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Safety &amp; Privacy
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="rounded-[8px] px-3 py-2 text-left text-[13px] transition-colors duration-150 hover:bg-white/[0.06]"
                    style={{ color: '#e87070' }}
                    onClick={() => {
                      setMenuOpen(false)
                      signOut({ callbackUrl: '/auth/signin' })
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
