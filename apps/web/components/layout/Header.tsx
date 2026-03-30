'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

const NAV_LINKS = [
  { label: 'Home',       href: '/' },
  { label: 'Stories',    href: '/stories' },
  { label: 'Audio',      href: '/audio' },
  { label: 'Companions', href: '/companions' },
  { label: 'Explore',    href: '/explore' },
]

export default function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const alias = session?.user?.alias ?? '??'
  const initials = alias.replace('@', '').slice(0, 2).toUpperCase()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[900] flex items-center justify-between px-5 md:px-10 h-[75px] border-b border-[#1c2333]"
      style={{
        background: 'rgba(7,9,15,0.82)',
        backdropFilter: 'blur(20px)',
        willChange: 'transform',
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex-shrink-0">
        <Image
          src="/logo_light.png"
          alt="BlushBite"
          width={120}
          height={56}
          priority
          style={{ objectFit: 'contain', objectPosition: 'left center' }}
        />
      </Link>

      {/* Centre nav — desktop only */}
      <nav className="hidden md:flex items-center gap-1">
        {NAV_LINKS.map(({ label, href }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link key={href} href={href}>
              <button
                className="text-[13.5px] px-[14px] py-[6px] rounded-[20px] border-none cursor-pointer transition-all duration-200"
                style={{
                  color: active ? '#eeeef0' : '#6b7280',
                  background: active ? 'rgba(232,96,122,0.14)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.color = '#eeeef0'
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }
                }}
              >
                {label}
              </button>
            </Link>
          )
        })}
      </nav>

      {/* Right — user pill with hover dropdown */}
      <div className="group relative flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#111620] border border-[#1c2333] py-[6px] pl-2 pr-[14px] rounded-[24px] cursor-pointer transition-colors duration-200 hover:border-[#e8607a]">
          {/* Avatar */}
          <div
            className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#e8607a,#9b5fe0)' }}
          >
            {initials}
          </div>
          {/* Alias */}
          <span className="text-[12px] text-[#6b7280]">{alias}</span>
          {/* Chevron */}
          <span className="text-[12px] text-[#6b7280] ml-1">▾</span>
        </div>

        {/* Dropdown */}
        <div
          className="absolute top-[calc(100%+10px)] right-0 w-[180px] bg-[#161d2a] border border-[#1c2333] rounded-[14px] p-2 flex-col gap-[2px] z-10 hidden group-hover:flex"
          style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
        >
          <button className="text-left text-[13px] text-[#6b7280] px-3 py-2 rounded-[8px] transition-colors duration-150 hover:bg-white/[0.06] hover:text-[#eeeef0]">
            Profile &amp; Preferences
          </button>
          <button className="text-left text-[13px] text-[#6b7280] px-3 py-2 rounded-[8px] transition-colors duration-150 hover:bg-white/[0.06] hover:text-[#eeeef0]">
            Safety &amp; Privacy
          </button>
          <button
            className="text-left text-[13px] px-3 py-2 rounded-[8px] transition-colors duration-150 hover:bg-white/[0.06]"
            style={{ color: '#e87070' }}
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
