import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { db } from '@/db'
import { companions, companionProfiles, companionPhotos } from '@/db/schema'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { CheckCircle, MapPin, MessageCircle } from 'lucide-react'

export const revalidate = 3600
export const dynamicParams = true

type Props = { params: Promise<{ alias: string }> }

async function getCompanionByAlias(alias: string) {
  const rows = await db
    .select({
      profileId: companionProfiles.id,
      companionId: companions.id,
      name: companions.name,
      date_of_birth: companions.date_of_birth,
      alias: companions.alias,
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
      instagram_handle: companionProfiles.instagram_handle,
      gender_community: companions.gender_community,
    })
    .from(companions)
    .innerJoin(companionProfiles, eq(companionProfiles.companion_id, companions.id))
    .where(and(eq(companions.alias, alias), eq(companionProfiles.is_visible_to_users, true)))
    .limit(1)

  if (!rows[0]) return null

  const profile = rows[0]
  const photos = await db
    .select({ url: companionPhotos.url, is_primary: companionPhotos.is_primary })
    .from(companionPhotos)
    .where(and(eq(companionPhotos.companion_profile_id, profile.profileId), isNull(companionPhotos.deleted_at)))
    .orderBy(sql`is_primary DESC`)

  const age = profile.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const currency = profile.currency ?? 'EUR'
  const currencySymbol: Record<string, string> = { EUR: '€', INR: '₹', USD: '$', GBP: '£' }
  const rate = profile.hourly_rate
    ? `${currencySymbol[currency] ?? currency}${Math.round(parseFloat(String(profile.hourly_rate)))}`
    : null

  return { ...profile, photos, age, rate }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { alias } = await params
  const data = await getCompanionByAlias(alias)
  if (!data) return { title: 'Companion Not Found — BlushBite' }

  const cityStr = data.city ? ` in ${data.city}` : ''
  return {
    title: `${data.name ?? 'Companion'}${cityStr} — BlushBite`,
    description: data.tagline ?? `${data.name ?? 'Private companion'} advertising time and companionship${cityStr}. EU-hosted platform.`,
    alternates: { canonical: `https://blushbite.co/companions/${alias}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${data.name ?? 'Companion'} — BlushBite`,
      description: data.tagline ?? undefined,
      images: data.photos[0]?.url ? [{ url: data.photos[0].url }] : [],
    },
  }
}

const COMMUNITY_CONFIG: Record<string, { label: string; color: string; href: string }> = {
  female: { label: 'Female', color: '#e8607a', href: '/female' },
  male: { label: 'Male', color: '#60a5fa', href: '/male' },
  shemale: { label: 'Trans', color: '#c084fc', href: '/shemale' },
}

export default async function CompanionProfilePage({ params }: Props) {
  const { alias } = await params
  const data = await getCompanionByAlias(alias)
  if (!data) notFound()

  const community = data.gender_community ?? 'female'
  const cfg = COMMUNITY_CONFIG[community] ?? COMMUNITY_CONFIG.female
  const primaryPhoto = data.photos.find((p) => p.is_primary)?.url ?? data.photos[0]?.url ?? null

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'BlushBite', item: 'https://blushbite.co' },
      { '@type': 'ListItem', position: 2, name: cfg.label, item: `https://blushbite.co${cfg.href}` },
      ...(data.city_slug && data.city
        ? [{ '@type': 'ListItem', position: 3, name: data.city, item: `https://blushbite.co${cfg.href}/${data.city_slug}` },
           { '@type': 'ListItem', position: 4, name: data.name ?? alias, item: `https://blushbite.co/companions/${alias}` }]
        : [{ '@type': 'ListItem', position: 3, name: data.name ?? alias, item: `https://blushbite.co/companions/${alias}` }]
      ),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div
        style={{
          minHeight: '100vh',
          background: '#07090f',
          paddingTop: 76,
          paddingBottom: 100,
        }}
      >
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px 0' }}>
          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
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
            <span style={{ fontSize: 12, color: cfg.color }}>{data.name ?? alias}</span>
          </nav>

          {/* Profile layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 24 }}>
            {/* Left — primary photo */}
            <div>
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '3/4',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: 'linear-gradient(145deg,#1a1228,#2a1535)',
                  border: '1px solid #1c2333',
                }}
              >
                {primaryPhoto && (
                  <Image
                    src={primaryPhoto}
                    alt={data.name ?? 'Companion photo'}
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'top' }}
                    sizes="(max-width: 760px) 50vw, 380px"
                    priority
                  />
                )}
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

              {/* Additional photos */}
              {data.photos.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                  {data.photos.slice(1, 4).map((p, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'relative',
                        aspectRatio: '1/1',
                        borderRadius: 10,
                        overflow: 'hidden',
                        background: '#0d1117',
                        border: '1px solid #1c2333',
                      }}
                    >
                      <Image
                        src={p.url}
                        alt={`${data.name ?? 'Companion'} photo ${i + 2}`}
                        fill
                        style={{ objectFit: 'cover', objectPosition: 'top' }}
                        sizes="120px"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right — profile info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h1
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 28,
                    color: '#eeeef0',
                    marginBottom: 4,
                    lineHeight: 1.2,
                  }}
                >
                  {data.name ?? 'Private Companion'}
                  {data.age && <span style={{ fontSize: 20, color: '#9ca3af', fontWeight: 300, marginLeft: 8 }}>{data.age}</span>}
                </h1>
                {data.tagline && (
                  <p style={{ fontSize: 14, color: '#9ca3af', fontStyle: 'italic', lineHeight: 1.5 }}>
                    &ldquo;{data.tagline}&rdquo;
                  </p>
                )}
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={13} color={cfg.color} />
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>{data.city}</span>
                  </div>
                )}
                {data.rate && (
                  <div style={{ fontSize: 13, color: cfg.color }}>
                    From {data.rate} / session
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 999,
                    background: `${cfg.color}12`, border: `1px solid ${cfg.color}30`, color: cfg.color,
                  }}>{cfg.label}</span>
                  {data.session_modality === 'online' && (
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 999,
                      background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa',
                    }}>Online</span>
                  )}
                  {data.session_modality === 'both' && (
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 999,
                      background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399',
                    }}>In person + Online</span>
                  )}
                </div>
              </div>

              {/* Bio */}
              {data.bio && (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: '#0d1117',
                    border: '1px solid #1c2333',
                  }}
                >
                  <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {data.bio}
                  </p>
                </div>
              )}

              {/* CTA */}
              {data.whatsapp_number && (
                <a
                  href={`https://wa.me/${data.whatsapp_number.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(data.name ?? 'there')}%2C%20I%20found%20your%20profile%20on%20BlushBite`}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '14px 24px',
                    borderRadius: 12,
                    background: '#25d366',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  <MessageCircle size={16} />
                  Contact on WhatsApp
                </a>
              )}

              <p style={{ fontSize: 11, color: '#4b5563', textAlign: 'center', lineHeight: 1.5 }}>
                This companion advertises their time and companionship independently.
                BlushBite is a classified platform — not a booking service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
