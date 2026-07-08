import type { Metadata } from 'next'
import GenderCityPage, { genderCityMeta } from '@/components/geo/GenderCityPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ country: string; city: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, city } = await params
  return genderCityMeta('female', country, city)
}

export default async function FemaleCityPage({ params }: Props) {
  const { country, city } = await params
  return <GenderCityPage gender="female" country={country} city={city} />
}
