import type { Metadata } from 'next'
import GenderCountryPage, { genderCountryMeta } from '@/components/geo/GenderCountryPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ country: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params
  return genderCountryMeta('female', country)
}

export default async function FemaleCountryPage({ params }: Props) {
  const { country } = await params
  return <GenderCountryPage gender="female" country={country} />
}
