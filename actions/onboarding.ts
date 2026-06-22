'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { seedOrganization } from '@/actions/seeds'
import type { SportKey } from '@/lib/seeds/sports'

export type OnboardingState = { error: string | null }

const OrgSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z
    .string()
    .trim()
    .min(2, 'El slug debe tener al menos 2 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  sport: z.enum(['padel', 'futbol', 'tenis', 'natacion', 'baloncesto', 'otro']),
})

export async function createOrganizationAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = OrgSchema.safeParse({
    name:  formData.get('name'),
    slug:  formData.get('slug'),
    sport: formData.get('sport'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, slug, sport } = parsed.data

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (existing) return { error: 'Ese identificador ya está en uso. Elige otro.' }

  const { data: org, error: orgErr } = await admin
    .from('organizations')
    .insert({
      name,
      slug,
      sport,
      plan: 'pro',
      status: 'active',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single()

  if (orgErr || !org) {
    console.error('[createOrganizationAction]', orgErr)
    return { error: 'No se pudo crear la organización. Intenta de nuevo.' }
  }

  const { error: profileErr } = await admin
    .from('profiles')
    .update({ organization_id: (org as { id: string }).id, role: 'admin' })
    .eq('id', user.id)

  if (profileErr) {
    console.error('[createOrganizationAction] profile update:', profileErr)
    return { error: 'Organización creada pero no se pudo vincular tu perfil.' }
  }

  if (sport !== 'otro') {
    try {
      await seedOrganization(org.id, sport as SportKey, user.id)
    } catch (err) {
      console.error('[createOrganizationAction] seed failed (non-blocking):', err)
    }
  }

  redirect('/admin/dashboard')
}
