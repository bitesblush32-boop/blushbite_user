import type { Metadata } from 'next'
import GenderCountryPage, { genderCountryMeta } from '@/components/geo/GenderCountryPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ country: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params
  return genderCountryMeta('shemale', country)
}

export default async function ShemaleCountryPage({ params }: Props) {
  const { country } = await params
  return <GenderCountryPage gender="shemale" country={country} />
}
