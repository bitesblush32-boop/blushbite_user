import type { Metadata } from 'next'
import GenderIndexPage from '@/components/geo/GenderIndexPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Male Companions — Time & Companionship | BlushBite',
  description:
    'Browse male companions available for time and companionship. Verified profiles. EU-hosted · GDPR compliant · BlushBite.',
  robots: { index: false, follow: true },
}

export default function MalePage() {
  return <GenderIndexPage gender="male" />
}
