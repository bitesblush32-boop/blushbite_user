import { db } from '@/db'
import { boostSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { Metadata } from 'next'
import Link from 'next/link'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Advertise on BlushBite — TS Escort & Shemale Escort Directory',
  description:
    'Advertise your TS escort, shemale escort or independent escort profile on BlushBite. Header banners, featured listings, right rail and sponsored placements. Book by the week — goes live immediately.',
  robots: { index: true, follow: true },
}

const LIVE_BOOST_URL = 'https://blushbite.live/dashboard/boost'

interface Pricing {
  header_banner: number
  right_rail: number
  featured: number
  mid_grid: number
}

async function getPricing(): Promise<Pricing> {
  try {
    const rows = await db
      .select({
        price_featured_eur: boostSettings.price_featured_eur,
        price_header_banner_eur: boostSettings.price_header_banner_eur,
        price_right_rail_eur: boostSettings.price_right_rail_eur,
        price_mid_grid_eur: boostSettings.price_mid_grid_eur,
      })
      .from(boostSettings)
      .where(eq(boostSettings.id, 1))
      .limit(1)
    const r = rows[0]
    return {
      header_banner: parseFloat(r?.price_header_banner_eur ?? '25'),
      right_rail: parseFloat(r?.price_right_rail_eur ?? '15'),
      featured: parseFloat(r?.price_featured_eur ?? '15'),
      mid_grid: parseFloat(r?.price_mid_grid_eur ?? '10'),
    }
  } catch {
    return { header_banner: 25, right_rail: 15, featured: 15, mid_grid: 10 }
  }
}

// ── Diagram Components ─────────────────────────────────────────────────────────

function DiagramNav() {
  return (
    <div
      style={{
        height: 24,
        background: '#0a0d15',
        borderBottom: '1px solid #1c2333',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        gap: 6,
        flexShrink: 0,
      }}
    >
      <div style={{ width: 28, height: 5, borderRadius: 2, background: '#e8607a', opacity: 0.85 }} />
      <div style={{ flex: 1 }} />
      <div style={{ width: 14, height: 4, borderRadius: 2, background: '#1c2333' }} />
      <div style={{ width: 14, height: 4, borderRadius: 2, background: '#1c2333' }} />
      <div style={{ width: 24, height: 4, borderRadius: 2, background: '#1c2333' }} />
    </div>
  )
}

function MiniCard({ highlight }: { highlight?: boolean }) {
  return (
    <div
      style={{
        height: 30,
        borderRadius: 4,
        background: highlight ? 'rgba(232,96,122,0.2)' : '#111620',
        border: `1px solid ${highlight ? 'rgba(232,96,122,0.5)' : '#1c2333'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {highlight && (
        <span style={{ fontSize: 6, color: '#e8607a', fontWeight: 700, letterSpacing: '0.05em' }}>
          AD
        </span>
      )}
    </div>
  )
}

function DiagramWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#080c14',
        border: '1px solid #1c2333',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}
    >
      {children}
    </div>
  )
}

function HeaderBannerDiagram() {
  return (
    <DiagramWrapper>
      <DiagramNav />
      <div
        style={{
          height: 30,
          background: 'rgba(232,96,122,0.15)',
          borderBottom: '1px solid rgba(232,96,122,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 8, color: '#e8607a', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          ▬ Header Banner
        </span>
        <span style={{ fontSize: 7, color: 'rgba(232,96,122,0.5)' }}>1200 × 200 px</span>
      </div>
      <div
        style={{
          height: 48,
          background: '#07090f',
          borderBottom: '1px solid #1c2333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        <div style={{ width: 72, height: 5, borderRadius: 2, background: '#1c2333' }} />
        <div style={{ width: 46, height: 4, borderRadius: 2, background: '#111620' }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
          <div style={{ width: 28, height: 14, borderRadius: 3, background: '#1c2333' }} />
          <div style={{ width: 28, height: 14, borderRadius: 3, background: '#111620' }} />
        </div>
      </div>
      <div style={{ padding: '8px 10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {Array.from({ length: 8 }).map((_, i) => <MiniCard key={i} />)}
      </div>
    </DiagramWrapper>
  )
}

function FeaturedDiagram() {
  return (
    <DiagramWrapper>
      <DiagramNav />
      <div style={{ height: 20, background: '#0d1117', borderBottom: '1px solid #1c2333' }} />
      <div
        style={{
          height: 36,
          background: '#07090f',
          borderBottom: '1px solid #1c2333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ width: 64, height: 4, borderRadius: 2, background: '#1c2333' }} />
        <div style={{ width: 42, height: 3, borderRadius: 2, background: '#111620' }} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 5,
          padding: '8px 10px',
          background: 'rgba(232,96,122,0.04)',
          borderBottom: '1px solid rgba(232,96,122,0.18)',
          borderTop: '1px solid rgba(232,96,122,0.18)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: 40,
              borderRadius: 5,
              background: 'rgba(232,96,122,0.16)',
              border: '1px solid rgba(232,96,122,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <span style={{ fontSize: 9, color: '#e8607a' }}>★</span>
            <span style={{ fontSize: 5.5, color: 'rgba(232,96,122,0.7)', fontWeight: 600 }}>
              FEATURED {i + 1}
            </span>
          </div>
        ))}
      </div>
      <div style={{ padding: '6px 10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {Array.from({ length: 8 }).map((_, i) => <MiniCard key={i} />)}
      </div>
    </DiagramWrapper>
  )
}

function RightRailDiagram() {
  return (
    <DiagramWrapper>
      <DiagramNav />
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              height: 40,
              background: '#07090f',
              borderBottom: '1px solid #1c2333',
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              gap: 6,
            }}
          >
            <div style={{ width: 56, height: 5, borderRadius: 2, background: '#1c2333' }} />
            <div style={{ width: 32, height: 5, borderRadius: 2, background: '#111620' }} />
          </div>
          <div
            style={{
              padding: '8px 10px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 4,
            }}
          >
            {Array.from({ length: 9 }).map((_, i) => <MiniCard key={i} />)}
          </div>
        </div>
        <div
          style={{
            width: 46,
            flexShrink: 0,
            borderLeft: '1px solid rgba(232,96,122,0.3)',
            background: 'rgba(232,96,122,0.05)',
            padding: '8px 5px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 26,
                borderRadius: 4,
                background: 'rgba(232,96,122,0.18)',
                border: '1px solid rgba(232,96,122,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 5.5, color: '#e8607a', fontWeight: 700 }}>AD</span>
            </div>
          ))}
          <div style={{ textAlign: 'center', paddingTop: 2 }}>
            <span style={{ fontSize: 6, color: 'rgba(232,96,122,0.45)', fontWeight: 600 }}>×10</span>
          </div>
        </div>
      </div>
    </DiagramWrapper>
  )
}

function MidGridDiagram() {
  return (
    <DiagramWrapper>
      <DiagramNav />
      <div style={{ height: 20, background: '#0d1117', borderBottom: '1px solid #1c2333' }} />
      <div style={{ height: 28, background: '#07090f', borderBottom: '1px solid #1c2333' }} />
      <div
        style={{
          padding: '8px 10px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 4,
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => <MiniCard key={i} highlight={i === 6} />)}
      </div>
    </DiagramWrapper>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default async function AdvertisePage() {
  const p = await getPricing()

  const placements = [
    {
      num: '01',
      tag: 'MOST VISIBLE',
      tagColor: '#e8607a',
      name: 'Header Banner',
      desc: 'Maximum visibility on our TS escort and shemale escort directory. Your banner appears at the very top of every escort listing page — above the grid, above every other profile. The first thing clients see when they land.',
      size: '1200 × 200 px',
      slots: '1 slot per community',
      price: p.header_banner,
      pages: ['Female escort listings (/female)', 'TS & shemale escort directory (/shemale)', 'Male escort listings (/male)', 'Independent escort browse page'],
      modes: ['Profile card (auto)', 'Custom image — JPG / PNG / WebP', 'Animated GIF'],
      tip: 'Best for launching a new escort listing or maximising profile views fast.',
      diagram: <HeaderBannerDiagram />,
    },
    {
      num: '02',
      tag: 'HIGH ENGAGEMENT',
      tagColor: '#c9a96e',
      name: 'Featured Escort Listings',
      desc: 'Three premium escort profile cards shown at the top of the directory before any organic search results. Clients browsing for TS escorts or shemale escorts see your listing first — name, photo, tagline, instantly.',
      size: 'Profile card (native)',
      slots: '3 slots per community',
      price: p.featured,
      pages: ['TS & shemale escort community pages', 'Independent escort home feed'],
      modes: ['Profile card (auto: your photo, name & tagline)'],
      tip: 'Best for direct client enquiries and escort profile click-throughs.',
      diagram: <FeaturedDiagram />,
    },
    {
      num: '03',
      tag: 'ALWAYS IN VIEW',
      tagColor: '#60a5fa',
      name: 'Right Rail',
      desc: 'A sticky sidebar column visible as clients scroll through every escort listing on the page. Up to 10 independent escorts can stack in the rail — each profile stays in view throughout the entire browsing session.',
      size: '200 × 286 px per slot',
      slots: '10 slots per community (stacked)',
      price: p.right_rail,
      pages: ['Escort directory home page', 'Browse escorts (desktop ≥ 1280 px)'],
      modes: ['Profile card (auto)', 'Custom image — JPG / PNG / WebP', 'Animated GIF'],
      tip: 'Best for sustained visibility across the full client browsing session.',
      diagram: <RightRailDiagram />,
    },
    {
      num: '04',
      tag: 'NATIVE FORMAT',
      tagColor: '#34d399',
      name: 'Sponsored Escort Listing',
      desc: 'A sponsored escort card embedded naturally in the browse grid at position 7. Matches the look of organic escort listings — clients engage without hesitation. Ideal for TS escorts and shemale escorts who want discovery without standing out as an ad.',
      size: 'Profile card (native)',
      slots: '1 slot per community',
      price: p.mid_grid,
      pages: ['TS & shemale escort community pages', 'Escort browse grid'],
      modes: ['Profile card (auto: your photo, name & tagline)'],
      tip: 'Best for discovery among clients actively browsing escort listings.',
      diagram: <MidGridDiagram />,
    },
  ]

  return (
    <main style={{ background: '#07090f', minHeight: '100vh', color: '#eeeef0', fontFamily: 'var(--font-sans)' }}>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          borderBottom: '1px solid #1c2333',
          padding: '40px 24px 36px',
          background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(232,96,122,0.05) 0%, transparent 70%)',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#e8607a',
                marginBottom: 10,
              }}
            >
              BlushBite · Escort Directory
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(26px, 4vw, 42px)',
                fontWeight: 700,
                lineHeight: 1.1,
                marginBottom: 10,
              }}
            >
              Advertise on BlushBite
            </h1>
            <p style={{ fontSize: 14, color: '#9ca3af', maxWidth: 540, lineHeight: 1.65 }}>
              Premium advertising placements for TS escorts, shemale escorts and independent escorts.
              Your profile in front of thousands of clients — every week.
            </p>
          </div>
          <a
            href={LIVE_BOOST_URL}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '13px 28px',
              background: '#e8607a',
              color: '#fff',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              flexShrink: 0,
              boxShadow: '0 6px 24px rgba(232,96,122,0.3)',
            }}
          >
            Book a placement →
          </a>
        </div>
      </div>

      {/* ── Placements ──────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px' }}>
        <div style={{ marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#e8607a', marginBottom: 10 }}>
            Ad Placements
          </p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 700 }}>
            Where your escort listing appears
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {placements.map((pl, idx) => (
            <div key={pl.num} style={{ padding: 'clamp(40px, 6vw, 72px) 0', borderBottom: '1px solid #1c2333' }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>{pl.diagram}</div>
                <div className={idx % 2 === 1 ? 'lg:order-1' : ''}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <span style={{ fontSize: 52, fontWeight: 900, color: '#111620', lineHeight: 1, letterSpacing: '-0.03em' }}>{pl.num}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: pl.tagColor, padding: '4px 10px', border: `1px solid ${pl.tagColor}44`, borderRadius: 4, background: `${pl.tagColor}10` }}>
                      {pl.tag}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, marginBottom: 14 }}>{pl.name}</h3>
                  <p style={{ fontSize: 15, color: '#9ca3af', lineHeight: 1.75, marginBottom: 28 }}>{pl.desc}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div style={{ background: '#0d1117', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Price</div>
                      <div style={{ fontSize: 26, fontWeight: 700, color: '#c9a96e', lineHeight: 1 }}>
                        €{pl.price}<span style={{ fontSize: 13, color: '#6b7280', fontWeight: 400 }}> /week</span>
                      </div>
                    </div>
                    <div style={{ background: '#0d1117', border: '1px solid #1c2333', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Availability</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#eeeef0', lineHeight: 1.5 }}>{pl.slots}</div>
                    </div>
                  </div>

                  <div style={{ background: '#0d1117', border: '1px solid #1c2333', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>Size</span>
                    <span style={{ fontSize: 13, color: '#eeeef0', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{pl.size}</span>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Appears on</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {pl.pages.map((pg) => (
                        <li key={pg} style={{ fontSize: 13, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#e8607a', fontSize: 8 }}>✦</span>{pg}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 11, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Creative options</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {pl.modes.map((m) => (
                        <span key={m} style={{ fontSize: 11, color: '#9ca3af', padding: '4px 10px', border: '1px solid #1c2333', borderRadius: 5, background: '#111620' }}>{m}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: '10px 14px', background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.18)', borderRadius: 8, marginBottom: 24 }}>
                    <span style={{ fontSize: 12, color: '#c9a96e' }}>💡 {pl.tip}</span>
                  </div>

                  <a
                    href={LIVE_BOOST_URL}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'rgba(232,96,122,0.1)', border: '1px solid rgba(232,96,122,0.3)', color: '#e8607a', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
                  >
                    Book {pl.name} →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Rate Table ──────────────────────────────────────────────────────── */}
      <section style={{ background: '#0d1117', borderTop: '1px solid #1c2333', borderBottom: '1px solid #1c2333', padding: 'clamp(48px, 7vw, 80px) 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#e8607a', marginBottom: 10 }}>Quick Reference</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, marginBottom: 32 }}>Rate card</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1c2333' }}>
                  {['Placement', 'Size', 'Slots per community', 'Price per week', 'Pages'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4b5563', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Header Banner', size: '1200 × 200 px', slots: '1', price: `€${p.header_banner}`, pages: 'All escort community pages' },
                  { name: 'Featured Escort Listings (×3)', size: 'Profile card', slots: '3', price: `€${p.featured} each`, pages: 'Community pages + home feed' },
                  { name: 'Right Rail', size: '200 × 286 px', slots: '10 (stacked)', price: `€${p.right_rail} each`, pages: 'Escort directory (desktop)' },
                  { name: 'Sponsored Escort Listing', size: 'Profile card', slots: '1', price: `€${p.mid_grid}`, pages: 'All escort community pages' },
                ].map((row, i) => (
                  <tr key={row.name} style={{ borderBottom: '1px solid #1c2333', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#eeeef0' }}>{row.name}</td>
                    <td style={{ padding: '14px 16px', color: '#9ca3af', fontFamily: 'monospace', fontSize: 12 }}>{row.size}</td>
                    <td style={{ padding: '14px 16px', color: '#9ca3af' }}>{row.slots}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#c9a96e' }}>{row.price}</td>
                    <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 12 }}>{row.pages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: '#4b5563', marginTop: 16 }}>
            * All prices are per week per community. Female, Male, and TS &amp; Shemale escorts each have separate inventory — booking one community does not affect availability in others.
          </p>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(48px, 7vw, 80px) 24px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#e8607a', marginBottom: 10 }}>Process</p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, marginBottom: 40 }}>Three steps to get listed</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Choose your placement', desc: 'Pick a placement type, select your escort community (Female / Male / TS & Shemale), and choose a week from the live availability calendar.' },
            { step: '2', title: 'Set your creative', desc: 'Use your escort profile card automatically — or upload a custom banner image or animated GIF. Headline and tagline are optional.' },
            { step: '3', title: 'Go live immediately', desc: 'Your escort listing ad appears the moment the week begins. No approval wait. Book up to 4 weeks in advance to secure your slot.' },
          ].map((s) => (
            <div key={s.step} style={{ background: '#0d1117', border: '1px solid #1c2333', borderRadius: 14, padding: '28px 24px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(232,96,122,0.12)', border: '1px solid rgba(232,96,122,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: '#e8607a', marginBottom: 16 }}>
                {s.step}
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section style={{ background: '#0d1117', borderTop: '1px solid #1c2333', padding: 'clamp(48px, 7vw, 80px) 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#e8607a', marginBottom: 10 }}>FAQ</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, marginBottom: 32 }}>Common questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { q: 'Which escort communities can I advertise in?', a: 'Female escorts, Male escorts, and TS & Shemale escorts. Each community has completely separate ad inventory — a slot you book in the TS & Shemale section does not affect Female or Male availability.' },
              { q: 'Do I need to upload a custom banner image?', a: 'No. Profile Card mode automatically pulls your primary escort photo, display name, and tagline. You can also upload a custom JPG/PNG/WebP image or an animated GIF for the Header Banner and Right Rail placements.' },
              { q: 'How far in advance can I book?', a: 'Up to 4 weeks ahead. The availability calendar on your escort dashboard shows which weeks are open or full in real time.' },
              { q: 'Can I book multiple ad slots in the same week?', a: 'Yes. The Right Rail supports up to 10 escort profiles per community per week — you can hold more than one slot. Header Banner, Featured Listings and Sponsored Listing are one slot per escort per placement type per week.' },
              { q: 'Can I advertise in more than one escort community?', a: 'Yes. If you advertise in both Female and TS & Shemale communities, each booking is independent and priced separately.' },
              { q: 'When does my escort ad go live?', a: 'Instantly when the booked week starts. Week slots run Monday 00:00 UTC through Sunday 23:59 UTC.' },
              { q: 'I\'m a TS escort on blushbite.live — how do I book?', a: 'Log in to your escort dashboard at blushbite.live, then go to Dashboard → Boost to see the live availability calendar and book your slot.' },
            ].map((faq) => (
              <details key={faq.q} style={{ borderBottom: '1px solid #1c2333', padding: '4px 0' }}>
                <summary style={{ padding: '16px 0', fontSize: 14, fontWeight: 600, color: '#eeeef0', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  {faq.q}
                  <span style={{ color: '#e8607a', flexShrink: 0, fontSize: 18 }}>+</span>
                </summary>
                <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.75, paddingBottom: 16, paddingRight: 24 }}>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: 'clamp(64px, 10vw, 100px) 24px',
          textAlign: 'center',
          background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(232,96,122,0.09) 0%, transparent 70%)',
          borderTop: '1px solid #1c2333',
        }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 16 }}>
            Get your escort profile seen
          </h2>
          <p style={{ fontSize: 16, color: '#9ca3af', marginBottom: 36, lineHeight: 1.7 }}>
            Thousands of clients search for TS escorts and shemale escorts on BlushBite every week.
            Secure your placement before it fills.
          </p>
          <a
            href={LIVE_BOOST_URL}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 36px', background: '#e8607a', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 32px rgba(232,96,122,0.35)' }}
          >
            Start advertising today →
          </a>
          <p style={{ fontSize: 12, color: '#4b5563', marginTop: 16 }}>
            You&apos;ll be taken to your escort dashboard on blushbite.live
          </p>
        </div>
      </section>
    </main>
  )
}
