import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Sidebar } from '@/components/layout/sidebar'
import { DemoBanner } from '@/components/demo-banner'

type Role = 'admin' | 'coach' | 'player'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const isDemo = cookieStore.get('x-demo-mode')?.value === '1'

  const { data } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  const profile = data as { full_name: string; email: string; role: Role } | null
  if (!profile) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        fullName={profile.full_name}
        email={profile.email}
        role={profile.role}
      />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
      {isDemo && <DemoBanner />}
    </div>
  )
}
