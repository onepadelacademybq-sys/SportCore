'use server'

import { requireAuth, requireRole } from '@/lib/auth'
import { assertQuota } from '@/lib/quota'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ResourceType = 'cancha' | 'campo' | 'carril' | 'pista' | 'sala'
export type CourtType    = 'indoor' | 'outdoor'
export type CourtSurface = 'cesped_artificial' | 'moqueta' | 'cristal' | 'hormigon'
export type CourtStatus  = 'active' | 'maintenance' | 'closed'

export type Court = {
  id:            string
  name:          string
  resource_type: ResourceType
  type:          CourtType
  surface:       CourtSurface
  status:        CourtStatus
  hourly_rate:   number
  notes:         string | null
  image_url:     string | null
  created_at:    string
}

export type CourtActionState = { error: string | null; success?: string }

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  cancha: 'Cancha',
  campo:  'Campo',
  carril: 'Carril',
  pista:  'Pista',
  sala:   'Sala',
}

export const COURT_TYPE_LABELS: Record<CourtType, string> = {
  indoor:  'Cubierta',
  outdoor: 'Exterior',
}

export const SURFACE_LABELS: Record<CourtSurface, string> = {
  cesped_artificial: 'Césped artificial',
  moqueta:           'Moqueta',
  cristal:           'Cristal',
  hormigon:          'Hormigón',
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getCourtsAdmin(): Promise<Court[]> {
  const { supabase } = await requireRole(['admin'])
  const { data } = await supabase
    .from('courts')
    .select('id, name, resource_type, type, surface, status, hourly_rate, notes, image_url, created_at')
    .order('name')
  return (data ?? []) as Court[]
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const CourtSchema = z.object({
  name:         z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  resourceType: z.enum(['cancha', 'campo', 'carril', 'pista', 'sala']),
  type:         z.enum(['indoor', 'outdoor']),
  surface:      z.enum(['cesped_artificial', 'moqueta', 'cristal', 'hormigon']),
  hourlyRate:   z.coerce.number().min(0, 'La tarifa no puede ser negativa'),
  notes:        z.string().trim().max(500).optional(),
})

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createCourtAction(
  _prev: CourtActionState,
  formData: FormData,
): Promise<CourtActionState> {
  const { supabase, organizationId } = await requireRole(['admin'])

  const parsed = CourtSchema.safeParse({
    name:         formData.get('name'),
    resourceType: formData.get('resourceType'),
    type:         formData.get('type'),
    surface:      formData.get('surface'),
    hourlyRate:   formData.get('hourlyRate') || 0,
    notes:        formData.get('notes') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    await assertQuota(organizationId, 'resources')
  } catch (e) {
    return { error: (e as Error).message }
  }

  const { name, resourceType, type, surface, hourlyRate, notes } = parsed.data

  const { error } = await supabase.from('courts').insert({
    organization_id: organizationId,
    name,
    resource_type: resourceType,
    type,
    surface,
    hourly_rate: hourlyRate,
    notes: notes ?? null,
  })

  if (error) {
    console.error('[createCourtAction]', error)
    return { error: 'No se pudo crear el espacio.' }
  }

  revalidatePath('/admin/courts')
  return { error: null, success: `Espacio "${name}" creado.` }
}

export async function updateCourtAction(
  _prev: CourtActionState,
  formData: FormData,
): Promise<CourtActionState> {
  const { supabase } = await requireRole(['admin'])

  const id = (formData.get('id') as string)?.trim()
  if (!z.string().uuid().safeParse(id).success) return { error: 'ID inválido' }

  const parsed = CourtSchema.safeParse({
    name:         formData.get('name'),
    resourceType: formData.get('resourceType'),
    type:         formData.get('type'),
    surface:      formData.get('surface'),
    hourlyRate:   formData.get('hourlyRate') || 0,
    notes:        formData.get('notes') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, resourceType, type, surface, hourlyRate, notes } = parsed.data

  const { error } = await supabase
    .from('courts')
    .update({
      name,
      resource_type: resourceType,
      type,
      surface,
      hourly_rate: hourlyRate,
      notes: notes ?? null,
    })
    .eq('id', id)

  if (error) {
    console.error('[updateCourtAction]', error)
    return { error: 'No se pudo actualizar el espacio.' }
  }

  revalidatePath('/admin/courts')
  return { error: null, success: 'Espacio actualizado.' }
}

export async function setCourtStatusAction(
  id: string,
  status: CourtStatus,
): Promise<CourtActionState> {
  const { supabase } = await requireRole(['admin'])

  if (!z.string().uuid().safeParse(id).success) return { error: 'ID inválido' }

  const { error } = await supabase
    .from('courts')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('[setCourtStatusAction]', error)
    return { error: 'No se pudo cambiar el estado.' }
  }

  revalidatePath('/admin/courts')
  return { error: null }
}
