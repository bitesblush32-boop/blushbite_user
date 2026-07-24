import type { Metadata } from 'next'
import { getCityCompanions, getCitySlugsForGender, slugToTitle } from '@/lib/cityPage'
import CityCompanionGrid from '@/components/CityCompanionGrid'

export const revalidate = 3600
export const dynamicParams = true

type Props = { params: Promise<{ city: string }> }

export async function generateStaticParams() {
  try {
    const slugs = await getCitySlugsForGender('male')
    return slugs.map((city) => ({ city }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params
  const cityName = slugToTitle(city)
  return {
    title: `Male Companions in ${cityName} — BlushBite`,
    description: `Browse verified male companions advertising time and companionship in ${cityName}. Private, discreet, EU-hosted platform.`,
    alternates: { canonical: `https://blushbite.co/male/${city}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: `Male Companions in ${cityName} — BlushBite`,
      description: `Verified male companions in ${cityName}. Private companionship platform.`,
    },
  }
}

export default async function MaleCityPage({ params }: Props) {
  const { city } = await params
  const cityName = slugToTitle(city)
  const companions = await getCityCompanions(city, 'male')

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'BlushBite', item: 'https://blushbite.co' },
      { '@type': 'ListItem', position: 2, name: 'Male', item: 'https://blushbite.co/male' },
      { '@type': 'ListItem', position: 3, name: cityName, item: `https://blushbite.co/male/${city}` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CityCompanionGrid
        community="male"
        city={city}
        cityName={cityName}
        companions={companions}
      />
    </>
  )
}
