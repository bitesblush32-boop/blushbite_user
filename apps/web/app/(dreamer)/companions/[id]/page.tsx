import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db'
import {
  companions,
  companionProfiles,
  companionPhotos,
  companionVideos,
  sessionCards,
  companionVibeTags,
  vibeTags,
} from '@/db/schema'
import { and, eq, isNull, asc, sql } from 'drizzle-orm'
import CompanionProfileClient from './CompanionProfileClient'
import ProfileOverlay from './ProfileOverlay'

export const revalidate = 3600
export const dynamicParams = true

type Props = { params: Promise<{ id: string }> }

const COMMUNITY_CONFIG: Record<
  string,
  { label: string; color: string; href: string; gradient: string }
> = {
  female: {
    label: 'Female Companions',
    color: '#e8607a',
    href: '/female',
    gradient: 'linear-gradient(135deg,#1a1228,#2a1535,#1a2240)',
  },
  male: {
    label: 'Male Companions',
    color: '#60a5fa',
    href: '/male',
    gradient: 'linear-gradient(135deg,#0f1a28,#1f2840,#2a1020)',
  },
  shemale: {
    label: 'Trans Companions',
    color: '#c084fc',
    href: '/shemale',
    gradient: 'linear-gradient(135deg,#201228,#1a2030,#2a1a18)',
  },
}

const GRADIENTS = [
  'linear-gradient(135deg,#1a1228,#2a1535,#1a2240)',
  'linear-gradient(135deg,#0f1a28,#1f2840,#2a1020)',
  'linear-gradient(135deg,#201228,#1a2030,#2a1a18)',
  'linear-gradient(135deg,#0a1620,#1a1535,#201a10)',
  'linear-gradient(135deg,#1a1020,#2a1530,#101820)',
  'linear-gradient(135deg,#101820,#201028,#102020)',
]

function gradientFromId(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return GRADIENTS[hash % GRADIENTS.length]
}

function sym(code: string): string {
  const map: Record<string, string> = { EUR: '€', INR: '₹', USD: '$', GBP: '£' }
  return map[code] ?? code
}

function fmtAttr(val: string | null | undefined): string | null {
  if (!val || val === 'prefer_not_to_say') return null
  return val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function ageFromDob(dob: Date | string | null): number | null {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

async function getData(profileId: string) {
  const [profileRow] = await db
    .select({
      profileId: companionProfiles.id,
      companionId: companionProfiles.companion_id,
      bio: companionProfiles.bio,
      tagline: companionProfiles.tagline,
      city: companionProfiles.city,
      city_slug: companionProfiles.city_slug,
      country_slug: companionProfiles.country_slug,
      currency: companionProfiles.currency,
      hourly_rate: companionProfiles.hourly_rate,
      is_verified: companionProfiles.is_verified,
      is_visible_to_users: companionProfiles.is_visible_to_users,
      session_modality: companionProfiles.session_modality,
      whatsapp_number: companionProfiles.whatsapp_number,
      telegram_handle: companionProfiles.telegram_handle,
      height_cm: companionProfiles.height_cm,
      body_type: companionProfiles.body_type,
      eye_color: companionProfiles.eye_color,
      hair_color: companionProfiles.hair_color,
      skin_color: companionProfiles.skin_color,
      ethnicity: companionProfiles.ethnicity,
      instagram_handle: companionProfiles.instagram_handle,
    })
    .from(companionProfiles)
    .where(
      and(eq(companionProfiles.id, profileId), eq(companionProfiles.is_visible_to_users, true))
    )
    .limit(1)

  if (!profileRow) return null

  const [companionRow, photoRows, videoRows, sessionCardRows, vibeTagRows, langResult] =
    await Promise.all([
      db
        .select({
          id: companions.id,
          name: companions.name,
          date_of_birth: companions.date_of_birth,
          gender_community: companions.gender_community,
        })
        .from(companions)
        .where(eq(companions.id, profileRow.companionId))
        .limit(1)
        .then((r) => r[0] ?? null),

      db
        .select({ url: companionPhotos.url, is_primary: companionPhotos.is_primary })
        .from(companionPhotos)
        .where(
          and(
            eq(companionPhotos.companion_profile_id, profileId),
            eq(companionPhotos.is_approved, true),
            isNull(companionPhotos.deleted_at)
          )
        )
        .orderBy(asc(companionPhotos.sort_order)),

      db
        .select({
          id: companionVideos.id,
          url: companionVideos.url,
          thumbnail_url: companionVideos.thumbnail_url,
          duration_seconds: companionVideos.duration_seconds,
        })
        .from(companionVideos)
        .where(
          and(
            eq(companionVideos.companion_profile_id, profileId),
            eq(companionVideos.is_approved, true),
            isNull(companionVideos.deleted_at)
          )
        ),

      db
        .select({
          id: sessionCards.id,
          title: sessionCards.title,
          description: sessionCards.description,
          price: sessionCards.price,
          currency: sessionCards.currency,
          duration_minutes: sessionCards.duration_minutes,
          session_type: sessionCards.session_type,
        })
        .from(sessionCards)
        .where(
          and(
            eq(sessionCards.companion_profile_id, profileId),
            eq(sessionCards.is_active, true),
            isNull(sessionCards.deleted_at)
          )
        )
        .orderBy(asc(sessionCards.sort_order)),

      db
        .select({ name: vibeTags.name })
        .from(companionVibeTags)
        .innerJoin(vibeTags, eq(vibeTags.id, companionVibeTags.vibe_tag_id))
        .where(eq(companionVibeTags.companion_profile_id, profileId)),

      // languages is not in Drizzle schema — query raw JSON column directly
      db.execute(sql`SELECT languages FROM companion_profiles WHERE id = ${profileId} LIMIT 1`),
    ])

  if (!companionRow || photoRows.length === 0) return null

  // Parse languages from raw JSON column result (db.execute returns rows directly as iterable)
  const rawLangs = (langResult[0] as { languages?: unknown } | undefined)?.languages
  const languages: string[] = Array.isArray(rawLangs) ? (rawLangs as string[]) : []

  const currency = profileRow.currency ?? 'EUR'
  const currSym = sym(currency)
  const age = ageFromDob(companionRow.date_of_birth)
  const primaryPhoto = photoRows.find((p) => p.is_primary)?.url ?? photoRows[0]?.url ?? null

  const minPrice = (() => {
    if (sessionCardRows.length > 0) {
      const cheapest = sessionCardRows.reduce(
        (min, sc) =>
          sc.price && parseFloat(sc.price) < parseFloat(min.price ?? '9999') ? sc : min,
        sessionCardRows[0]
      )
      return `${sym(cheapest.currency ?? 'EUR')}${Math.round(parseFloat(cheapest.price ?? '0'))}`
    }
    if (profileRow.hourly_rate) {
      return `${currSym}${Math.round(parseFloat(String(profileRow.hourly_rate)))}`
    }
    return null
  })()

  const community = companionRow.gender_community ?? 'female'
  const cfg = COMMUNITY_CONFIG[community] ?? COMMUNITY_CONFIG.female

  return {
    profileId,
    name: companionRow.name ?? 'Private Companion',
    age,
    bio: profileRow.bio,
    tagline: profileRow.tagline,
    city: profileRow.city,
    city_slug: profileRow.city_slug,
    country_slug: profileRow.country_slug,
    is_verified: profileRow.is_verified ?? false,
    session_modality: profileRow.session_modality,
    whatsapp_number: profileRow.whatsapp_number ?? null,
    telegram_handle: profileRow.telegram_handle ?? null,
    minPrice,
    primaryPhoto,
    photoUrls: photoRows.map((p) => p.url),
    videos: videoRows.map((v) => ({
      id: v.id,
      url: v.url,
      thumbnailUrl: v.thumbnail_url,
      durationSeconds: v.duration_seconds,
    })),
    sessionCards: sessionCardRows.map((sc) => ({
      id: sc.id,
      title: sc.title,
      description: sc.description,
      price: sc.price ? `${sym(sc.currency ?? 'EUR')}${Math.round(parseFloat(sc.price))}` : null,
      durationMinutes: sc.duration_minutes,
    })),
    tags: vibeTagRows.map((v) => v.name),
    languages,
    height_cm: profileRow.height_cm ?? null,
    body_type: profileRow.body_type ?? null,
    eye_color: profileRow.eye_color ?? null,
    hair_color: profileRow.hair_color ?? null,
    skin_color: profileRow.skin_color ?? null,
    ethnicity: profileRow.ethnicity ?? null,
    instagram_handle: profileRow.instagram_handle ?? null,
    community,
    cfg,
    gradient: gradientFromId(profileId),
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const data = await getData(id)
  if (!data) return { title: 'Companion Not Found — BlushBite' }

  const cityStr = data.city ? ` in ${data.city}` : ''
  const title = `${data.name}${cityStr} — BlushBite`
  const description =
    data.tagline ??
    `${data.name} — private companion${cityStr}. EU-hosted platform. Discretion guaranteed.`

  return {
    title,
    description,
    alternates: { canonical: `https://blushbite.co/companions/${id}` },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: `https://blushbite.co/companions/${id}`,
      images: data.primaryPhoto ? [{ url: data.primaryPhoto, width: 800, height: 1000 }] : [],
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function CompanionProfilePage({ params }: Props) {
  const { id } = await params
  const data = await getData(id)
  if (!data) notFound()

  // JSON-LD outside the overlay so crawlers always see it
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'BlushBite', item: 'https://blushbite.co' },
      {
        '@type': 'ListItem',
        position: 2,
        name: data.cfg.label,
        item: `https://blushbite.co${data.cfg.href}`,
      },
      ...(data.city_slug && data.city
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: data.city,
              item: `https://blushbite.co${data.cfg.href}/${data.city_slug}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: data.name,
              item: `https://blushbite.co/companions/${id}`,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 3,
              name: data.name,
              item: `https://blushbite.co/companions/${id}`,
            },
          ]),
    ],
  }

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: data.name,
    description: data.tagline ?? undefined,
    image: data.primaryPhoto ?? undefined,
    address: data.city ? { '@type': 'PostalAddress', addressLocality: data.city } : undefined,
    url: `https://blushbite.co/companions/${id}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      {/* Breadcrumb — visually hidden, present for in-page SEO and aria */}
      <nav aria-label="Breadcrumb" style={{ display: 'none' }}>
        <Link href="/">BlushBite</Link>
        <Link href={data.cfg.href}>{data.cfg.label}</Link>
        {data.city_slug && data.city && (
          <Link href={`${data.cfg.href}/${data.city_slug}`}>{data.city}</Link>
        )}
        <span>{data.name}</span>
      </nav>

      {/* Profile overlay — handles backdrop, close button, entrance animation */}
      <ProfileOverlay accentColor={data.cfg.color}>
        {/* ── SECTION A: Hero band ─────────────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid #1c2333' }}>
          <div className="flex flex-col md:flex-row" style={{ position: 'relative' }}>
            {/* Image strip */}
            <div
              className="w-full md:w-[220px] md:flex-shrink-0 relative overflow-hidden"
              style={{ background: data.gradient, minHeight: 220 }}
            >
              {data.primaryPhoto ? (
                <>
                  {/* Mobile: capped height so details are always reachable */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.primaryPhoto}
                    alt={data.name}
                    className="w-full block md:hidden"
                    style={{ maxHeight: '42vh', objectFit: 'cover', objectPosition: 'top' }}
                    draggable={false}
                  />
                  {/* Desktop: fill column */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.primaryPhoto}
                    alt={data.name}
                    className="hidden md:block absolute inset-0 w-full h-full object-cover object-top"
                    draggable={false}
                  />
                </>
              ) : (
                <div className="h-[220px] md:absolute md:inset-0 md:h-full flex items-center justify-center">
                  <svg width="100" height="200" viewBox="0 0 80 160" fill="rgba(255,255,255,0.18)">
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
                style={{ background: 'linear-gradient(90deg, transparent 50%, #0d1117 100%)' }}
              />
            </div>

            {/* Details column
                Mobile:  20px all sides, 52px right to clear the ✕ button
                Desktop: 36px all sides, close button at card edge doesn't overlap text */}
            <div className="flex-1 flex flex-col justify-between p-5 pr-14 md:p-9 md:pr-14">
              <div>
                {/* Verified chip */}
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
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: data.cfg.color,
                      display: 'inline-block',
                    }}
                  />
                  {data.is_verified ? 'Verified companion' : 'Companion'}
                </span>

                {/* Name */}
                <h1
                  className="text-[26px] md:text-[34px]"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: '#eeeef0',
                    marginBottom: 4,
                    lineHeight: 1.15,
                  }}
                >
                  {data.name}
                  {data.age && (
                    <span
                      style={{
                        fontSize: 17,
                        color: '#6b7280',
                        fontFamily: 'inherit',
                        fontWeight: 300,
                      }}
                    >
                      , {data.age}
                    </span>
                  )}
                </h1>

                {/* Tagline */}
                {data.tagline && (
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14, lineHeight: 1.55 }}>
                    {data.tagline}
                  </p>
                )}

                {/* Badges row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                    marginBottom: 10,
                  }}
                >
                  {data.is_verified && (
                    <span
                      style={{
                        fontSize: 11,
                        color: '#c9a96e',
                        padding: '3px 9px',
                        borderRadius: 999,
                        background: 'rgba(201,169,110,0.1)',
                        border: '1px solid rgba(201,169,110,0.3)',
                      }}
                    >
                      ✦ Verified
                    </span>
                  )}
                  {data.city && (
                    <span
                      style={{
                        fontSize: 11,
                        color: '#e8607a',
                        padding: '3px 9px',
                        borderRadius: 999,
                        background: 'rgba(232,96,122,0.1)',
                        border: '1px solid rgba(232,96,122,0.25)',
                      }}
                    >
                      {data.city}
                    </span>
                  )}
                  {data.minPrice && (
                    <span style={{ fontSize: 12, color: data.cfg.color }}>
                      From {data.minPrice}
                    </span>
                  )}
                </div>

                {/* Modality */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {data.session_modality === 'online' && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 9px',
                        borderRadius: 999,
                        background: 'rgba(96,165,250,0.1)',
                        border: '1px solid rgba(96,165,250,0.25)',
                        color: '#60a5fa',
                      }}
                    >
                      Online
                    </span>
                  )}
                  {data.session_modality === 'in_person' && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 9px',
                        borderRadius: 999,
                        background: 'rgba(52,211,153,0.1)',
                        border: '1px solid rgba(52,211,153,0.25)',
                        color: '#34d399',
                      }}
                    >
                      In person
                    </span>
                  )}
                  {data.session_modality === 'both' && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 9px',
                        borderRadius: 999,
                        background: 'rgba(52,211,153,0.1)',
                        border: '1px solid rgba(52,211,153,0.25)',
                        color: '#34d399',
                      }}
                    >
                      In person · Online
                    </span>
                  )}
                </div>

                {/* Physical attributes — only rendered if ≥1 value present */}
                {(() => {
                  const parts = [
                    data.height_cm ? `${data.height_cm}cm` : null,
                    fmtAttr(data.body_type),
                    fmtAttr(data.ethnicity),
                    data.eye_color && data.eye_color !== 'prefer_not_to_say'
                      ? `${fmtAttr(data.eye_color)} eyes`
                      : null,
                    data.hair_color && data.hair_color !== 'prefer_not_to_say'
                      ? `${fmtAttr(data.hair_color)} hair`
                      : null,
                  ].filter(Boolean)
                  if (parts.length === 0) return null
                  return (
                    <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, marginTop: 4 }}>
                      {parts.join(' · ')}
                    </p>
                  )
                })()}

                {/* Languages */}
                {data.languages.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                    {data.languages.map((lang) => (
                      <span
                        key={lang}
                        style={{
                          fontSize: 11,
                          padding: '3px 9px',
                          borderRadius: 999,
                          border: '1px solid rgba(201,169,110,0.2)',
                          color: '#c9a96e',
                          background: 'rgba(201,169,110,0.06)',
                        }}
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                )}

                {/* Vibe tags */}
                {data.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {data.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11,
                          padding: '3px 9px',
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
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14 }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    color: '#6b7280',
                  }}
                >
                  <span style={{ color: '#c9a96e' }}>🔒</span>Anonymous
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    color: '#6b7280',
                  }}
                >
                  <span style={{ color: '#c9a96e' }}>✦</span>EU hosted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION B: Interactive body (client island) ───────────────────── */}
        <div style={{ padding: '22px 18px 32px' }} className="md:px-9 md:pb-10">
          <CompanionProfileClient
            profileId={data.profileId}
            companionName={data.name}
            photoUrls={data.photoUrls}
            videos={data.videos}
            bio={data.bio}
            sessionCards={data.sessionCards}
            whatsappNumber={data.whatsapp_number}
            telegramHandle={data.telegram_handle}
            instagramHandle={data.instagram_handle}
            gradient={data.gradient}
            accentColor={data.cfg.color}
          />
        </div>
      </ProfileOverlay>
    </>
  )
}
