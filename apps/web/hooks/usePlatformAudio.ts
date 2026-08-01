import { useQuery } from '@tanstack/react-query'
import type { Audio } from '@/lib/types'

interface AudioPage {
  items: (Audio & { url: string })[]
}

async function fetchAudio(): Promise<AudioPage> {
  const res = await fetch('/api/platform-audio?limit=12')
  if (!res.ok) throw new Error('Failed to load audio')
  return res.json()
}

export function usePlatformAudio() {
  const query = useQuery<AudioPage, Error>({
    queryKey: ['audio', 'feed'],
    queryFn: fetchAudio,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    items: query.data?.items ?? [],
    status: query.status,
  }
}
