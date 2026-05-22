import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const ROLE_DASHBOARD = {
  admin: '/admin/dashboard',
  coach: '/coach/dashboard',
  player: '/player/dashboard',
} as const

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (data as { role?: string } | null)?.role as
    | keyof typeof ROLE_DASHBOARD
    | undefined

  redirect(role && role in ROLE_DASHBOARD ? ROLE_DASHBOARD[role] : '/login')
}
