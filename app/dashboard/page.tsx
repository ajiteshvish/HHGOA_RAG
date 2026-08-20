import { getSessionUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardClient from './components/DashboardClient'

export default async function DashboardPage() {
  const user = await getSessionUser()

  if (!user) {
    return redirect('/login')
  }

  return <DashboardClient userEmail={user.email} />
}
