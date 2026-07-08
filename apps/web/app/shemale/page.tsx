import type { Metadata } from 'next'
import GenderIndexPage from '@/components/geo/GenderIndexPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Trans Companions & TS Escorts — Time & Companionship | BlushBite',
  description:
    'Browse trans companions and TS escorts available for time and companionship. Verified profiles. EU-hosted · GDPR compliant · BlushBite.',
  robots: { index: false, follow: true },
}

export default function ShemalePage() {
  return <GenderIndexPage gender="shemale" />
}
