'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export type GuardianProfile = {
  id: string
  minor_id: string
  guardian_name: string
  guardian_document: string
  guardian_phone: string
  guardian_email: string
  guardian_relationship: 'padre' | 'madre' | 'tutor_legal' | 'otro'
  consent_accepted: boolean
  consent_date: string
  created_at: string
}

export const RELATIONSHIP_LABELS: Record<string, string> = {
  padre:        'Padre',
  madre:        'Madre',
  tutor_legal:  'Tutor legal',
  otro:         'Otro',
}

const GuardianSchema = z.object({
  guardianName:         z.string().min(2, 'Nombre del representante requerido'),
  guardianDocument:     z.string().min(3, 'Documento del representante requerido'),
  guardianPhone:        z.string().min(7, 'Teléfono del representante requerido'),
  guardianEmail:        z.string().email('Email del representante inválido'),
  guardianRelationship: z.enum(['padre', 'madre', 'tutor_legal', 'otro'], {
    error: 'Selecciona la relación con el menor',
  }),
  guardianConsent: z.literal('on', {
    error: 'Debes aceptar el tratamiento de datos del menor',
  }),
})

export async function saveGuardianProfile(
  minorId: string,
  formData: FormData,
): Promise<{ error: string | null }> {
  const parsed = GuardianSchema.safeParse({
    guardianName:         formData.get('guardianName'),
    guardianDocument:     formData.get('guardianDocument'),
    guardianPhone:        formData.get('guardianPhone'),
    guardianEmail:        formData.get('guardianEmail'),
    guardianRelationship: formData.get('guardianRelationship'),
    guardianConsent:      formData.get('guardianConsent'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const admin = createAdminClient()
  const { error } = await admin.from('guardian_profiles').insert({
    minor_id:              minorId,
    guardian_name:         parsed.data.guardianName,
    guardian_document:     parsed.data.guardianDocument,
    guardian_phone:        parsed.data.guardianPhone,
    guardian_email:        parsed.data.guardianEmail,
    guardian_relationship: parsed.data.guardianRelationship,
    consent_accepted:      true,
    consent_date:          new Date().toISOString(),
  })

  if (error) {
    console.error('[saveGuardianProfile]', error)
    return { error: 'Error al guardar datos del representante.' }
  }

  return { error: null }
}

export async function getGuardianProfile(minorId: string): Promise<GuardianProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as { role?: string } | null)?.role !== 'admin') redirect('/admin/dashboard')

  const admin = createAdminClient()
  const { data } = await admin
    .from('guardian_profiles')
    .select('*')
    .eq('minor_id', minorId)
    .maybeSingle()

  return (data as GuardianProfile | null)
}
