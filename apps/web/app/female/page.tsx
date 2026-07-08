import type { Metadata } from 'next'
import GenderIndexPage from '@/components/geo/GenderIndexPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Female Companions — Time & Companionship | BlushBite',
  description:
    'Browse female companions available for time and companionship. Verified profiles. EU-hosted · GDPR compliant · BlushBite.',
  robots: { index: false, follow: true },
}

export default function FemalePage() {
  return <GenderIndexPage gender="female" />
}
