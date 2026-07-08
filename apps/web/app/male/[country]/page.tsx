import type { Metadata } from 'next'
import GenderCountryPage, { genderCountryMeta } from '@/components/geo/GenderCountryPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ country: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params
  return genderCountryMeta('male', country)
}

export default async function MaleCountryPage({ params }: Props) {
  const { country } = await params
  return <GenderCountryPage gender="male" country={country} />
}
