'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ActionState = { error: string | null; success?: string }

export type CoachCertification = {
  id: string
  title: string
  issuing_organization: string
  obtained_at: string
  expires_at: string | null
  document_url: string | null
  is_validated: boolean
  created_at: string
}

export type CoachAvailabilitySlot = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export type CoachActivity = {
  total_classes: number
  classes_this_month: number
  active_groups: number
  historical_groups: number
  total_players: number
  evaluations_count: number
  mesocycles_count: number
}

export type CoachProfileFull = {
  id: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  bio: string | null
  specialties: string[]
  preferred_levels: string[]
  training_style: string | null
  years_experience: number
  languages: string[]
  rating_average: number | null
  hourly_rate_am: number
  hourly_rate_pm: number
  hourly_rate_weekend: number
  certifications: CoachCertification[]
  availability: CoachAvailabilitySlot[]
  activity: CoachActivity
}

// ─── Guard ───────────────────────────────────────────────────────────────────

async function requireCoach() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (data as { role?: string } | null)?.role
  if (role !== 'coach' && role !== 'admin') redirect('/coach/dashboard')

  return { supabase, userId: user.id }
}

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v ?? 0)
}

// ─── getMyCoachProfile ───────────────────────────────────────────────────────

export async function getMyCoachProfile(): Promise<CoachProfileFull> {
  const { supabase, userId } = await requireCoach()

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, avatar_url')
    .eq('id', userId)
    .single()

  // Ensure coach_profile row exists
  let { data: coachRow } = await supabase
    .from('coach_profiles')
    .select('bio, specialties, preferred_levels, training_style, years_experience, languages, rating_average, hourly_rate_am, hourly_rate_pm, hourly_rate_weekend')
    .eq('coach_id', userId)
    .maybeSingle()

  if (!coachRow) {
    await supabase.from('coach_profiles').insert({ coach_id: userId })
    const { data } = await supabase
      .from('coach_profiles')
      .select('bio, specialties, preferred_levels, training_style, years_experience, languages, rating_average, hourly_rate_am, hourly_rate_pm, hourly_rate_weekend')
      .eq('coach_id', userId)
      .single()
    coachRow = data
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [certRes, availRes, classesRes, classesMonthRes, groupsRes, evalsRes, mesoRes] = await Promise.all([
    supabase
      .from('coach_certifications')
      .select('id, title, issuing_organization, obtained_at, expires_at, document_url, is_validated, created_at')
      .eq('coach_id', userId)
      .order('obtained_at', { ascending: false }),
    supabase
      .from('coach_availability')
      .select('id, day_of_week, start_time, end_time')
      .eq('coach_id', userId)
      .order('day_of_week')
      .order('start_time'),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', userId)
      .in('status', ['confirmed', 'completed']),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', userId)
      .in('status', ['confirmed', 'completed'])
      .gte('start_time', monthStart),
    supabase
      .from('training_groups')
      .select('id, status')
      .eq('coach_id', userId),
    supabase
      .from('evaluations')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', userId),
    supabase
      .from('mesocycles')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId),
  ])

  const groups = (groupsRes.data ?? []) as { id: string; status: string }[]
  const activeGroups = groups.filter((g) => g.status === 'active').length
  const historicalGroups = groups.filter((g) => g.status !== 'active').length

  let totalPlayers = 0
  if (groups.length > 0) {
    const { data: memberRows } = await supabase
      .from('group_members')
      .select('player_id')
      .in('group_id', groups.map((g) => g.id))
    const uniqueIds = new Set(((memberRows ?? []) as { player_id: string }[]).map((m) => m.player_id))
    totalPlayers = uniqueIds.size
  }

  const cr = (coachRow ?? {}) as Record<string, unknown>
  const pr = (profileRow ?? {}) as Record<string, unknown>

  return {
    id: String(pr.id ?? userId),
    full_name: String(pr.full_name ?? ''),
    email: String(pr.email ?? ''),
    phone: (pr.phone as string | null) ?? null,
    avatar_url: (pr.avatar_url as string | null) ?? null,
    bio: (cr.bio as string | null) ?? null,
    specialties: (cr.specialties as string[]) ?? [],
    preferred_levels: (cr.preferred_levels as string[]) ?? [],
    training_style: (cr.training_style as string | null) ?? null,
    years_experience: num(cr.years_experience),
    languages: (cr.languages as string[]) ?? ['es'],
    rating_average: cr.rating_average ? num(cr.rating_average) : null,
    hourly_rate_am: num(cr.hourly_rate_am) || 35000,
    hourly_rate_pm: num(cr.hourly_rate_pm) || 70000,
    hourly_rate_weekend: num(cr.hourly_rate_weekend) || 60000,
    certifications: (certRes.data ?? []) as CoachCertification[],
    availability: (availRes.data ?? []) as CoachAvailabilitySlot[],
    activity: {
      total_classes: classesRes.count ?? 0,
      classes_this_month: classesMonthRes.count ?? 0,
      active_groups: activeGroups,
      historical_groups: historicalGroups,
      total_players: totalPlayers,
      evaluations_count: evalsRes.count ?? 0,
      mesocycles_count: mesoRes.count ?? 0,
    },
  }
}

// ─── updateCoachProfile ──────────────────────────────────────────────────────

const ProfileSchema = z.object({
  full_name: z.string().min(1).max(100),
  phone: z.string().max(20).nullable().optional(),
  bio: z.string().max(800).nullable().optional(),
  specialties: z.array(z.string()).max(6),
  preferred_levels: z.array(z.string()),
  training_style: z.string().max(1000).nullable().optional(),
  years_experience: z.coerce.number().int().min(0).max(60),
  languages: z.array(z.string().min(1)).min(1),
})

export async function updateCoachProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId } = await requireCoach()

  const raw = {
    full_name: formData.get('full_name'),
    phone: (formData.get('phone') as string) || null,
    bio: (formData.get('bio') as string) || null,
    specialties: formData.getAll('specialties') as string[],
    preferred_levels: formData.getAll('preferred_levels') as string[],
    training_style: (formData.get('training_style') as string) || null,
    years_experience: formData.get('years_experience'),
    languages: (formData.getAll('languages') as string[]).filter(Boolean),
  }

  const parsed = ProfileSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Datos inválidos: ' + parsed.error.issues[0]?.message }

  const { full_name, phone, ...coachData } = parsed.data

  const [profileRes, coachRes] = await Promise.all([
    supabase.from('profiles').update({ full_name, phone }).eq('id', userId),
    supabase.from('coach_profiles').upsert({ coach_id: userId, ...coachData }),
  ])

  if (profileRes.error || coachRes.error) {
    console.error('[updateCoachProfile]', profileRes.error, coachRes.error)
    return { error: 'No se pudo guardar el perfil.' }
  }

  revalidatePath('/coach/profile')
  return { error: null, success: 'Perfil actualizado correctamente.' }
}

// ─── updateAvatarUrl ─────────────────────────────────────────────────────────

export async function updateAvatarUrl(url: string): Promise<ActionState> {
  const { supabase, userId } = await requireCoach()

  if (!url) return { error: 'URL requerida.' }

  const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
  if (error) return { error: 'No se pudo actualizar la foto.' }

  revalidatePath('/coach/profile')
  return { error: null, success: 'Foto actualizada.' }
}

// ─── addCertification ────────────────────────────────────────────────────────

const CertSchema = z.object({
  title: z.string().min(1).max(200),
  issuing_organization: z.string().min(1).max(200),
  obtained_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expires_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  document_url: z.string().url().nullable().optional(),
})

export async function addCertification(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId } = await requireCoach()

  const raw = {
    title: formData.get('title'),
    issuing_organization: formData.get('issuing_organization'),
    obtained_at: formData.get('obtained_at'),
    expires_at: (formData.get('expires_at') as string) || null,
    document_url: (formData.get('document_url') as string) || null,
  }

  const parsed = CertSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Datos de certificación inválidos.' }

  // Ensure coach_profile row exists before inserting child
  await supabase.from('coach_profiles').upsert({ coach_id: userId })

  const { error } = await supabase
    .from('coach_certifications')
    .insert({ coach_id: userId, ...parsed.data })

  if (error) {
    console.error('[addCertification]', error)
    return { error: 'No se pudo agregar la certificación.' }
  }

  revalidatePath('/coach/profile')
  return { error: null, success: 'Certificación agregada.' }
}

// ─── removeCertification ────────────────────────────────────────────────────

export async function removeCertification(id: string): Promise<ActionState> {
  const { supabase, userId } = await requireCoach()

  if (!z.string().uuid().safeParse(id).success) return { error: 'ID inválido.' }

  const { error } = await supabase
    .from('coach_certifications')
    .delete()
    .eq('id', id)
    .eq('coach_id', userId)

  if (error) return { error: 'No se pudo eliminar la certificación.' }

  revalidatePath('/coach/profile')
  return { error: null, success: 'Certificación eliminada.' }
}

// ─── updateAvailability ──────────────────────────────────────────────────────

const SlotSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
})

export async function updateAvailability(
  slots: { day_of_week: number; start_time: string; end_time: string }[]
): Promise<ActionState> {
  const { supabase, userId } = await requireCoach()

  const parsed = z.array(SlotSchema).safeParse(slots)
  if (!parsed.success) return { error: 'Franjas horarias inválidas.' }

  await supabase.from('coach_profiles').upsert({ coach_id: userId })

  const { error: delError } = await supabase
    .from('coach_availability')
    .delete()
    .eq('coach_id', userId)

  if (delError) return { error: 'Error al actualizar disponibilidad.' }

  if (parsed.data.length > 0) {
    const { error: insError } = await supabase
      .from('coach_availability')
      .insert(parsed.data.map((s) => ({ coach_id: userId, ...s })))

    if (insError) return { error: 'Error al guardar disponibilidad.' }
  }

  revalidatePath('/coach/profile')
  return { error: null, success: 'Disponibilidad actualizada.' }
}
