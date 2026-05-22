import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'

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
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
