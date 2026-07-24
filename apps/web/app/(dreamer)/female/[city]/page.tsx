import type { Metadata } from 'next'
import { getCityCompanions, getCitySlugsForGender, slugToTitle } from '@/lib/cityPage'
import CityCompanionGrid from '@/components/CityCompanionGrid'

export const revalidate = 3600
export const dynamicParams = true

type Props = { params: Promise<{ city: string }> }

export async function generateStaticParams() {
  const slugs = await getCitySlugsForGender('female')
  return slugs.map((city) => ({ city }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params
  const cityName = slugToTitle(city)
  return {
    title: `Female Companions in ${cityName} — BlushBite`,
    description: `Browse verified female companions advertising time and companionship in ${cityName}. Private, discreet, EU-hosted platform.`,
    alternates: { canonical: `https://blushbite.co/female/${city}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: `Female Companions in ${cityName} — BlushBite`,
      description: `Verified female companions in ${cityName}. Private companionship platform.`,
    },
  }
}

export default async function FemaleCityPage({ params }: Props) {
  const { city } = await params
  const cityName = slugToTitle(city)
  const companions = await getCityCompanions(city, 'female')

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'BlushBite', item: 'https://blushbite.co' },
      { '@type': 'ListItem', position: 2, name: 'Female', item: 'https://blushbite.co/female' },
      { '@type': 'ListItem', position: 3, name: cityName, item: `https://blushbite.co/female/${city}` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CityCompanionGrid
        community="female"
        city={city}
        cityName={cityName}
        companions={companions}
      />
    </>
  )
}
