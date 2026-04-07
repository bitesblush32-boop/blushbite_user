import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user as any
  if (!session || user?.platform_role !== 'admin') {
    redirect('/auth/signin')
  }
  return <>{children}</>
}
