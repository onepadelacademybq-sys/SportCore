'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireSuperAdmin(): Promise<{ userId: string; email: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const allowed = (process.env.SUPERADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)

  if (!allowed.includes(user.email ?? '')) redirect('/admin/dashboard')

  return { userId: user.id, email: user.email! }
}
