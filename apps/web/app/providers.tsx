'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:            60 * 1000,
        refetchOnWindowFocus: false,
        retry:                1,
      },
    },
  }))

  // session={null} tells SessionProvider not to fetch /api/auth/session —
  // useSession() calls across the app return { data: null, status: 'unauthenticated' }
  return (
    <SessionProvider session={null}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}
