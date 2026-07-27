import type { Metadata } from 'next'
import { getCityCompanions, getCitySlugsForGender, slugToTitle } from '@/lib/cityPage'
import CityCompanionGrid from '@/components/CityCompanionGrid'

export const revalidate = 3600
export const dynamicParams = true

type Props = { params: Promise<{ city: string }> }

export async function generateStaticParams() {
  try {
    const slugs = await getCitySlugsForGender('shemale')
    return slugs.map((city) => ({ city }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params
  const cityName = slugToTitle(city)
  return {
    title: `Trans Companions in ${cityName} — BlushBite`,
    description: `Browse verified trans and shemale companions advertising time and companionship in ${cityName}. Private, discreet, EU-hosted platform.`,
    alternates: { canonical: `https://blushbite.co/shemale/${city}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: `Trans Companions in ${cityName} — BlushBite`,
      description: `Verified trans companions in ${cityName}. Private companionship platform.`,
    },
  }
}

export default async function ShemaleCityPage({ params }: Props) {
  const { city } = await params
  const cityName = slugToTitle(city)
  const companions = await getCityCompanions(city, 'shemale')

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'BlushBite', item: 'https://blushbite.co' },
      { '@type': 'ListItem', position: 2, name: 'Trans', item: 'https://blushbite.co/shemale' },
      {
        '@type': 'ListItem',
        position: 3,
        name: cityName,
        item: `https://blushbite.co/shemale/${city}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CityCompanionGrid
        community="shemale"
        city={city}
        cityName={cityName}
        companions={companions}
      />
    </>
  )
}
