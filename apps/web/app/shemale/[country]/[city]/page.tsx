import type { Metadata } from 'next'
import GenderCityPage, { genderCityMeta } from '@/components/geo/GenderCityPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ country: string; city: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, city } = await params
  return genderCityMeta('shemale', country, city)
}

export default async function ShemaleCityPage({ params }: Props) {
  const { country, city } = await params
  return <GenderCityPage gender="shemale" country={country} city={city} />
}
