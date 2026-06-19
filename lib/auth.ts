'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type AuthContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  role: 'admin' | 'coach' | 'player'
  fullName: string
  organizationId: string
}

/**
 * Verifica sesión activa y retorna el contexto de auth + org.
 * Redirige a /login si no hay sesión, a /onboarding si no hay org asignada.
 */
export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('profiles')
    .select('id, role, full_name, organization_id')
    .eq('id', user.id)
    .single()

  if (!data) redirect('/login')
  if (!data.organization_id) redirect('/onboarding')

  return {
    supabase,
    userId: user.id,
    role: data.role as 'admin' | 'coach' | 'player',
    fullName: data.full_name,
    organizationId: data.organization_id,
  }
}

/**
 * Igual que requireAuth() pero acepta un rol específico.
 * Lanza si el usuario no tiene el rol requerido.
 */
export async function requireRole(
  allowedRoles: Array<'admin' | 'coach' | 'player'>
): Promise<AuthContext> {
  const ctx = await requireAuth()
  if (!allowedRoles.includes(ctx.role)) redirect(`/${ctx.role}/dashboard`)
  return ctx
}
