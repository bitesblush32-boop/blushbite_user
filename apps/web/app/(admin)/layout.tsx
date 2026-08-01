import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies()
  const session = store.get('admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret || !session || session !== secret) {
    redirect('/admin-login')
  }
  return <>{children}</>
}
