import { redirect } from 'next/navigation'
import { getCommunityFlags } from '@/lib/community-flags'
import HomePageContent from '@/components/HomePageContent'

export default async function MalePage() {
  const flags = await getCommunityFlags()
  if (!flags.male_enabled) redirect('/shemale')
  return <HomePageContent forceCommunity="male" />
}
