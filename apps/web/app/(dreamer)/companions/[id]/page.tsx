import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db'
import { companions, companionProfiles, companionPhotos, sessionCards, companionVibeTags, vibeTags } from '@/db/schema'
import { and, eq, isNull, sql, asc } from 'drizzle-orm'
import { CheckCircle } from 'lucide-react'

export const revalidate = 3600
export const dynamicParams = true

type Props = { params: Promise<{ id: string }> }


async function getCompanionById(id: string) {
  const rows = await db
    .select({
      profileId: companionProfiles.id,
      companionId: companions.id,
      name: companions.name,
      date_of_birth: companions.date_of_birth,
      bio: companionProfiles.bio,
      tagline: companionProfiles.tagline,
      city: companionProfiles.city,
      city_slug: companionProfiles.city_slug,
      country_slug: companionProfiles.country_slug,
      hourly_rate: companionProfiles.hourly_rate,
      currency: companionProfiles.currency,
      is_verified: companionProfiles.is_verified,
      is_visible_to_users: companionProfiles.is_visible_to_users,
      session_modality: companionProfiles.session_modality,
      whatsapp_number: companionProfiles.whatsapp_number,
      telegram_handle: companionProfiles.telegram_handle,
      instagram_handle: companionProfiles.instagram_handle,
      gender_community: companions.gender_community,
    })
    .from(companions)
    .innerJoin(companionProfiles, eq(companionProfiles.companion_id, companions.id))
    .where(and(eq(companionProfiles.id, id), eq(companionProfiles.is_visible_to_users, true)))
    .limit(1)

  if (!rows[0]) return null

  const profile = rows[0]

  const [photos, sessionCardRows, vibeTagRows] = await Promise.all([
    db
      .select({ url: companionPhotos.url, is_primary: companionPhotos.is_primary })
      .from(companionPhotos)
      .where(and(eq(companionPhotos.companion_profile_id, profile.profileId), isNull(companionPhotos.deleted_at)))
      .orderBy(sql`is_primary DESC`),

    db
      .select({
        id: sessionCards.id,
        title: sessionCards.title,
        description: sessionCards.description,
        price: sessionCards.price,
        currency: sessionCards.currency,
        session_type: sessionCards.session_type,
        duration_minutes: sessionCards.duration_minutes,
      })
      .from(sessionCards)
      .where(
        and(
          eq(sessionCards.companion_profile_id, profile.profileId),
          eq(sessionCards.is_active, true),
          isNull(sessionCards.deleted_at)
        )
      )
      .orderBy(asc(sessionCards.sort_order)),

    db
      .select({ name: vibeTags.name })
      .from(companionVibeTags)
      .innerJoin(vibeTags, eq(vibeTags.id, companionVibeTags.vibe_tag_id))
      .where(eq(companionVibeTags.companion_profile_id, profile.profileId)),
  ])

  const age = profile.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const currency = profile.currency ?? 'EUR'
  const currencySymbol: Record<string, string> = { EUR: '€', INR: '₹', USD: '$', GBP: '£' }
  const sym = currencySymbol[currency] ?? currency

  const rate = profile.hourly_rate
    ? `${sym}${Math.round(parseFloat(String(profile.hourly_rate)))}`
    : null

  const sessions =
    sessionCardRows.length > 0
      ? sessionCardRows.map((sc) => ({
          name: sc.title ?? 'Session',
          desc: sc.description ?? '',
          price: sc.price ? `${sym}${Math.round(parseFloat(sc.price))}` : 'On request',
          pills: sc.duration_minutes ? [`${sc.duration_minutes} min`] : [],
        }))
      : []

  return { ...profile, photos, age, rate, sessions, tags: vibeTagRows.map((v) => v.name) }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const data = await getCompanionById(id)
  if (!data) return { title: 'Companion Not Found — BlushBite' }

  const cityStr = data.city ? ` in ${data.city}` : ''
  return {
    title: `${data.name ?? 'Companion'}${cityStr} — BlushBite`,
    description: data.tagline ?? `${data.name ?? 'Private companion'} advertising time and companionship${cityStr}. EU-hosted platform.`,
    alternates: { canonical: `https://blushbite.co/companions/${id}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${data.name ?? 'Companion'} — BlushBite`,
      description: data.tagline ?? undefined,
      images: data.photos[0]?.url ? [{ url: data.photos[0].url }] : [],
    },
  }
}

const COMMUNITY_CONFIG: Record<string, { label: string; color: string; href: string; gradient: string }> = {
  female:   { label: 'Female', color: '#e8607a', href: '/female',   gradient: 'linear-gradient(135deg,#1a1228,#2a1535,#1a2240)' },
  male:     { label: 'Male',   color: '#60a5fa', href: '/male',     gradient: 'linear-gradient(135deg,#0f1a28,#1f2840,#2a1020)' },
  shemale:  { label: 'Trans',  color: '#c084fc', href: '/shemale',  gradient: 'linear-gradient(135deg,#201228,#1a2030,#2a1a18)' },
}

export default async function CompanionProfilePage({ params }: Props) {
  const { id } = await params
  const data = await getCompanionById(id)
  if (!data) notFound()

  const community = data.gender_community ?? 'female'
  const cfg = COMMUNITY_CONFIG[community] ?? COMMUNITY_CONFIG.female
  const primaryPhoto = data.photos.find((p) => p.is_primary)?.url ?? data.photos[0]?.url ?? null

  const waNum = data.whatsapp_number?.replace(/^\+/, '') ?? null
  const tgVal = data.telegram_handle?.startsWith('@')
    ? data.telegram_handle.slice(1)
    : data.telegram_handle ?? null

  const whatsappHref = waNum
    ? `https://wa.me/${waNum}?text=${encodeURIComponent(`Hi ${data.name ?? 'there'}, I found your profile on BlushBite`)}`
    : null
  const telegramHref = tgVal ? `https://t.me/${tgVal}` : null

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'BlushBite', item: 'https://blushbite.co' },
      { '@type': 'ListItem', position: 2, name: cfg.label, item: `https://blushbite.co${cfg.href}` },
      ...(data.city_slug && data.city
        ? [
            { '@type': 'ListItem', position: 3, name: data.city, item: `https://blushbite.co${cfg.href}/${data.city_slug}` },
            { '@type': 'ListItem', position: 4, name: data.name ?? 'Companion', item: `https://blushbite.co/companions/${id}` },
          ]
        : [{ '@type': 'ListItem', position: 3, name: data.name ?? 'Companion', item: `https://blushbite.co/companions/${id}` }]),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div style={{ minHeight: '100vh', background: '#07090f', paddingTop: 76, paddingBottom: 100 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px 0' }}>

          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
            <Link href="/" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}>BlushBite</Link>
            <span style={{ fontSize: 12, color: '#4b5563' }}>/</span>
            <Link href={cfg.href} style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}>{cfg.label}</Link>
            {data.city_slug && data.city && (
              <>
                <span style={{ fontSize: 12, color: '#4b5563' }}>/</span>
                <Link href={`${cfg.href}/${data.city_slug}`} style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}>{data.city}</Link>
              </>
            )}
            <span style={{ fontSize: 12, color: '#4b5563' }}>/</span>
            <span style={{ fontSize: 12, color: cfg.color }}>{data.name ?? 'Companion'}</span>
          </nav>

          {/* ── SECTION A: Hero band ─────────────────────────────────────────── */}
          <div
            className="flex flex-col md:flex-row"
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid #1c2333',
              background: '#0d1117',
              marginBottom: 0,
            }}
          >
            {/* Image strip */}
            <div
              className="w-full md:w-[220px] md:flex-shrink-0 relative overflow-hidden"
              style={{ background: cfg.gradient, minHeight: 200 }}
            >
              {primaryPhoto ? (
                <>
                  {/* Mobile: natural height */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryPhoto}
                    alt={data.name ?? 'Companion photo'}
                    className="w-full h-auto block md:hidden"
                    draggable={false}
                  />
                  {/* Desktop: fill column */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryPhoto}
                    alt={data.name ?? 'Companion photo'}
                    className="hidden md:block absolute inset-0 w-full h-full object-cover object-top"
                    draggable={false}
                  />
                </>
              ) : (
                <div className="h-[220px] md:absolute md:inset-0 md:h-full flex items-center justify-center">
                  <svg width="80" height="160" viewBox="0 0 80 160" fill="rgba(255,255,255,0.15)">
                    <ellipse cx="40" cy="26" rx="20" ry="24" />
                    <path d="M16 90 Q24 55 40 52 Q56 55 64 90 L68 170 Q58 182 40 184 Q24 182 12 170Z" />
                  </svg>
                </div>
              )}

              {/* Bottom fade — mobile only */}
              <div
                className="absolute inset-x-0 bottom-0 h-16 md:hidden pointer-events-none"
                style={{ background: 'linear-gradient(to top, #0d1117 0%, transparent 100%)' }}
              />
              {/* Right fade — desktop only */}
              <div
                className="absolute inset-0 hidden md:block pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent 55%, #0d1117 100%)' }}
              />

              {/* Verified badge */}
              {data.is_verified && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'rgba(201,169,110,0.15)',
                    border: '1px solid rgba(201,169,110,0.4)',
                  }}
                >
                  <CheckCircle size={11} color="#c9a96e" />
                  <span style={{ fontSize: 11, color: '#c9a96e', fontWeight: 500 }}>Verified</span>
                </div>
              )}
            </div>

            {/* Details column */}
            <div
              className="flex-1 p-5 md:p-8 flex flex-col"
              style={{ justifyContent: 'space-between', gap: 16 }}
            >
              <div>
                {/* Hero chip */}
                <div style={{ marginBottom: 12 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      color: '#9ca3af',
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: '1px solid #1c2333',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: cfg.color,
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    {data.is_verified ? 'Verified companion' : 'Companion'}
                  </span>
                </div>

                {/* Name + age */}
                <h1
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 28,
                    color: '#eeeef0',
                    marginBottom: 4,
                    lineHeight: 1.1,
                  }}
                >
                  {data.name ?? 'Private Companion'}
                  {data.age && (
                    <span style={{ fontSize: 18, color: '#6b7280', fontFamily: 'inherit', fontWeight: 300 }}>
                      , {data.age}
                    </span>
                  )}
                </h1>

                {/* Tagline */}
                {data.tagline && (
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, lineHeight: 1.5 }}>
                    {data.tagline}
                  </p>
                )}

                {/* Badges row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {data.is_verified && (
                    <span
                      style={{
                        fontSize: 11,
                        color: '#c9a96e',
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: 'rgba(201,169,110,0.1)',
                        border: '1px solid rgba(201,169,110,0.3)',
                      }}
                    >
                      ✦ Verified &amp; Licensed
                    </span>
                  )}
                  {data.city && (
                    <span
                      style={{
                        fontSize: 11,
                        color: '#e8607a',
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: 'rgba(232,96,122,0.1)',
                        border: '1px solid rgba(232,96,122,0.25)',
                      }}
                    >
                      Active · {data.city}
                    </span>
                  )}
                  {data.rate && (
                    <span style={{ fontSize: 12, color: cfg.color }}>From {data.rate}</span>
                  )}
                </div>

                {/* Modality */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {data.session_modality === 'online' && (
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 999,
                      background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa',
                    }}>Online</span>
                  )}
                  {data.session_modality === 'in_person' && (
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 999,
                      background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399',
                    }}>In person</span>
                  )}
                  {data.session_modality === 'both' && (
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 999,
                      background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399',
                    }}>In person + Online</span>
                  )}
                </div>

                {/* Vibe tags */}
                {data.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {data.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11,
                          padding: '4px 10px',
                          borderRadius: 999,
                          border: '1px solid #1c2333',
                          color: '#6b7280',
                          background: 'rgba(255,255,255,0.03)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Trust row */}
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#6b7280' }}>
                  <span style={{ color: '#c9a96e' }}>🔒</span>Anonymous booking
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#6b7280' }}>
                  <span style={{ color: '#c9a96e' }}>✦</span>Verified &amp; licensed
                </span>
              </div>
            </div>
          </div>

          {/* ── SECTION B: Body ─────────────────────────────────────────────────── */}
          <div
            style={{
              background: '#0d1117',
              border: '1px solid #1c2333',
              borderTop: 'none',
              borderRadius: '0 0 16px 16px',
              padding: '24px 20px',
            }}
            className="md:px-8"
          >
            {/* Photo gallery strip */}
            {data.photos.length > 1 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 10, color: '#e8607a', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 12 }}>
                  Photos
                </p>
                <div
                  className="flex gap-2 overflow-x-auto pb-1"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {data.photos.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        flexShrink: 0,
                        width: 80,
                        height: 108,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: '1px solid #1c2333',
                        background: '#111620',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {data.bio && (
              <p
                style={{
                  fontSize: 13.5,
                  color: '#6b7280',
                  lineHeight: 1.75,
                  marginBottom: 32,
                  maxWidth: 520,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {data.bio}
              </p>
            )}

            {/* Session cards */}
            {data.sessions.length > 0 && (
              <>
                <p style={{ fontSize: 10, color: '#e8607a', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 4 }}>
                  Choose an experience
                </p>
                <p style={{ fontSize: 11, color: '#4b5563', marginBottom: 16 }}>
                  Available sessions
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ marginBottom: 32 }}>
                  {data.sessions.map((session, idx) => (
                    <div
                      key={idx}
                      style={{
                        border: '1px solid #1c2333',
                        background: '#111620',
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <div style={{ fontSize: 13.5, color: '#eeeef0', fontWeight: 500, marginBottom: 4 }}>
                        {session.name}
                      </div>
                      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, lineHeight: 1.5 }}>
                        {session.desc}
                      </p>
                      <div style={{ fontSize: 12, color: cfg.color, marginBottom: 10 }}>
                        {session.price}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {session.pills.map((pill) => (
                          <span
                            key={pill}
                            style={{
                              fontSize: 10,
                              color: '#6b7280',
                              border: '1px solid #1c2333',
                              borderRadius: 999,
                              padding: '3px 10px',
                            }}
                          >
                            {pill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* CTA buttons */}
            {whatsappHref || telegramHref ? (
              <div className="flex flex-col sm:flex-row gap-3" style={{ marginBottom: 16 }}>
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex-1 flex items-center justify-center gap-[10px] py-[13px] px-5 rounded-[10px] text-[13.5px] font-medium text-white transition-all duration-200 hover:-translate-y-px"
                    style={{
                      background: 'linear-gradient(135deg, #25D366, #1da851)',
                      boxShadow: '0 4px 20px rgba(37,211,102,0.22)',
                      textDecoration: 'none',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.528 5.855L0 24l6.335-1.505A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.5-5.207-1.378l-.373-.22-3.862.917.974-3.768-.243-.387A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                    </svg>
                    Message on WhatsApp
                  </a>
                )}
                {telegramHref && (
                  <a
                    href={telegramHref}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex-1 flex items-center justify-center gap-[10px] py-[13px] px-5 rounded-[10px] text-[13.5px] font-medium text-white transition-all duration-200 hover:-translate-y-px"
                    style={{
                      background: 'linear-gradient(135deg, #229ED9, #1a7fb5)',
                      boxShadow: '0 4px 20px rgba(34,158,217,0.22)',
                      textDecoration: 'none',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.664l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.958.895z" />
                    </svg>
                    Chat on Telegram
                  </a>
                )}
              </div>
            ) : (
              <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', padding: '12px 0', marginBottom: 16 }}>
                Contact details coming soon.
              </p>
            )}

            <p style={{ textAlign: 'center', fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
              Your identity stays private — always.
            </p>
            <p style={{ textAlign: 'center', fontSize: 11, color: '#4b5563', lineHeight: 1.5 }}>
              This companion advertises their time and companionship independently.
              BlushBite is a classified platform — not a booking service.
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
