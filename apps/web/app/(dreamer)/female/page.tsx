import { redirect } from 'next/navigation'
import { getCommunityFlags } from '@/lib/community-flags'
import HomePageContent from '@/components/HomePageContent'

export default async function FemalePage() {
  const flags = await getCommunityFlags()
  if (!flags.female_enabled) redirect('/shemale')
  return <HomePageContent forceCommunity="female" />
}
