'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'coach' | 'player'

export type ActionState = { error: string | null; success?: string }

export type UserListItem = {
  id: string
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export type UserBooking = {
  id: string
  start_time: string
  end_time: string
  status: 'pending' | 'paid' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  price: number
}

export type UserGroup = { id: string; name: string; level: string; status: string; memberId: string }
export type UserEvaluation = { id: string; title: string; evaluated_at: string; is_shared: boolean }
export type UserAssignment = { id: string; name: string; status: string; assigned_at: string }

export type PaymentBehavior = {
  total: number
  paid: number       // confirmed + completed
  pending: number    // pending + paid (esperando verificación)
  cancelled: number
}

export type UserWallet = { total_classes: number; used_classes: number; available_classes: number }

export type CoachTaughtClass = { id: string; start_time: string; end_time: string; status: string; price: number }
export type CoachMesocycle   = { id: string; name: string; status: string; duration_weeks: number; start_date: string | null }
export type CoachUpcoming    = { id: string; start_time: string; end_time: string }
export type CoachPlayer      = { id: string; full_name: string; email: string; padel_level: string | null; group_name: string }

export type CoachData = {
  taughtClasses:   CoachTaughtClass[]
  mesocycles:      CoachMesocycle[]
  upcomingClasses: CoachUpcoming[]
  assignedPlayers: CoachPlayer[]
}

export type UserProfileFull = {
  profile: {
    id: string
    full_name: string
    email: string
    document_id: string | null
    phone: string | null
    date_of_birth: string | null
    address: string | null
    padel_level: string | null
    role: UserRole
    is_active: boolean
    created_at: string
  }
  bookings: UserBooking[]
  groups: UserGroup[]
  evaluations: UserEvaluation[]
  assignments: UserAssignment[]
  payment: PaymentBehavior
  wallet: UserWallet
  coach?: CoachData
}

export type UserFilters = { role?: UserRole; search?: string }

// ─── Guards ───────────────────────────────────────────────────────────────────

async function requireAdmin() {
  return requireRole(['admin'])
}

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v ?? 0)
}

// ─── Listado ──────────────────────────────────────────────────────────────────

export async function getUsers(filters?: UserFilters): Promise<UserListItem[]> {
  const { supabase } = await requireAdmin()

  let q = supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, created_at')
    .order('created_at', { ascending: false })

  if (filters?.role) q = q.eq('role', filters.role)

  if (filters?.search) {
    const s = filters.search.replace(/[,()%]/g, '').trim()
    if (s) q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%`)
  }

  const { data } = await q
  return (data ?? []) as UserListItem[]
}

// ─── Perfil completo con historial ──────────────────────────────────────────────

export async function getUserProfile(id: string): Promise<UserProfileFull | null> {
  const { supabase } = await requireAdmin()

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('id, full_name, email, document_id, phone, date_of_birth, address, padel_level, role, is_active, created_at')
    .eq('id', id)
    .single()

  if (!profileRow) return null
  const profile = profileRow as UserProfileFull['profile']

  // ─── Coach: vista diferente ───────────────────────────────────────────────
  if (profile.role === 'coach') {
    const now = new Date().toISOString()
    const [taughtRes, mesoRes, upcomingRes, groupsRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, start_time, end_time, status, price')
        .eq('coach_id', id)
        .in('status', ['confirmed', 'completed'])
        .order('start_time', { ascending: false })
        .limit(5),
      supabase
        .from('mesocycles')
        .select('id, name, status, duration_weeks, start_date')
        .eq('created_by', id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('bookings')
        .select('id, start_time, end_time')
        .eq('coach_id', id)
        .eq('status', 'confirmed')
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(5),
      supabase
        .from('training_groups')
        .select('id, name')
        .eq('coach_id', id)
        .eq('status', 'active'),
    ])

    const taughtClasses: CoachTaughtClass[] = ((taughtRes.data ?? []) as CoachTaughtClass[]).map((b) => ({ ...b, price: num(b.price) }))
    const mesocycles: CoachMesocycle[] = (mesoRes.data ?? []) as CoachMesocycle[]
    const upcomingClasses: CoachUpcoming[] = (upcomingRes.data ?? []) as CoachUpcoming[]

    const groupRows = (groupsRes.data ?? []) as { id: string; name: string }[]
    let assignedPlayers: CoachPlayer[] = []
    if (groupRows.length > 0) {
      const { data: memberRows } = await supabase
        .from('group_members')
        .select('player_id, group_id')
        .in('group_id', groupRows.map((g) => g.id))
        .eq('status', 'active')

      const members = (memberRows ?? []) as { player_id: string; group_id: string }[]
      if (members.length > 0) {
        const uniquePlayerIds = [...new Set(members.map((m) => m.player_id))]
        const { data: playerRows } = await supabase
          .from('profiles')
          .select('id, full_name, email, padel_level')
          .in('id', uniquePlayerIds)

        const groupById = new Map(groupRows.map((g) => [g.id, g.name]))
        const playerById = new Map(
          ((playerRows ?? []) as { id: string; full_name: string; email: string; padel_level: string | null }[])
            .map((p) => [p.id, p])
        )
        const seen = new Set<string>()
        assignedPlayers = members
          .filter((m) => { if (seen.has(m.player_id)) return false; seen.add(m.player_id); return true })
          .map((m) => {
            const p = playerById.get(m.player_id)
            return p ? { id: p.id, full_name: p.full_name, email: p.email, padel_level: p.padel_level, group_name: groupById.get(m.group_id) ?? '—' } : null
          })
          .filter((p): p is CoachPlayer => p !== null)
      }
    }

    return {
      profile,
      bookings: [], groups: [], evaluations: [], assignments: [],
      payment: { total: 0, paid: 0, pending: 0, cancelled: 0 },
      wallet: { total_classes: 0, used_classes: 0, available_classes: 0 },
      coach: { taughtClasses, mesocycles, upcomingClasses, assignedPlayers },
    }
  }

  // ─── Player / Admin ───────────────────────────────────────────────────────
  const [
    bookingsRes,
    statusesRes,
    membersRes,
    evalsRes,
    assignmentsRes,
    walletRes,
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, start_time, end_time, status, price')
      .eq('player_id', id)
      .order('start_time', { ascending: false })
      .limit(5),
    supabase
      .from('bookings')
      .select('status')
      .eq('player_id', id),
    supabase
      .from('group_members')
      .select('id, group_id, status')
      .eq('player_id', id),
    supabase
      .from('evaluations')
      .select('id, title, evaluated_at, is_shared')
      .eq('player_id', id)
      .order('evaluated_at', { ascending: false })
      .limit(10),
    supabase
      .from('mesocycle_assignments')
      .select('id, mesocycle_id, assigned_at')
      .eq('player_id', id)
      .order('assigned_at', { ascending: false }),
    supabase
      .from('class_wallet')
      .select('total_classes, used_classes, available_classes')
      .eq('player_id', id)
      .maybeSingle(),
  ])

  const bookings: UserBooking[] = ((bookingsRes.data ?? []) as UserBooking[]).map((b) => ({
    ...b,
    price: num(b.price),
  }))

  // Comportamiento de pago
  const statuses = (statusesRes.data ?? []) as { status: UserBooking['status'] }[]
  const payment: PaymentBehavior = {
    total: statuses.length,
    paid: statuses.filter((s) => s.status === 'confirmed' || s.status === 'completed').length,
    pending: statuses.filter((s) => s.status === 'pending' || s.status === 'paid').length,
    cancelled: statuses.filter((s) => s.status === 'cancelled' || s.status === 'no_show').length,
  }

  // Grupos (resolver nombres en una segunda consulta)
  const memberRows = (membersRes.data ?? []) as { id: string; group_id: string; status: string }[]
  let groups: UserGroup[] = []
  if (memberRows.length > 0) {
    const { data: groupRows } = await supabase
      .from('training_groups')
      .select('id, name, level, status')
      .in('id', memberRows.map((m) => m.group_id))
    const byId = new Map(((groupRows ?? []) as { id: string; name: string; level: string; status: string }[]).map((g) => [g.id, g]))
    groups = memberRows
      .map((m) => {
        const g = byId.get(m.group_id)
        return g ? { id: g.id, name: g.name, level: g.level, status: m.status, memberId: m.id } : null
      })
      .filter((g): g is UserGroup => g !== null)
  }

  // Planificaciones (resolver nombres del mesociclo)
  const assignRows = (assignmentsRes.data ?? []) as { id: string; mesocycle_id: string; assigned_at: string }[]
  let assignments: UserAssignment[] = []
  if (assignRows.length > 0) {
    const { data: mesoRows } = await supabase
      .from('mesocycles')
      .select('id, name, status')
      .in('id', assignRows.map((a) => a.mesocycle_id))
    const byId = new Map(((mesoRows ?? []) as { id: string; name: string; status: string }[]).map((m) => [m.id, m]))
    assignments = assignRows.map((a) => {
      const m = byId.get(a.mesocycle_id)
      return {
        id: a.id,
        name: m?.name ?? 'Mesociclo',
        status: m?.status ?? '—',
        assigned_at: a.assigned_at,
      }
    })
  }

  const evaluations = (evalsRes.data ?? []) as UserEvaluation[]

  const w = walletRes.data as UserWallet | null
  const wallet: UserWallet = w
    ? { total_classes: num(w.total_classes), used_classes: num(w.used_classes), available_classes: num(w.available_classes) }
    : { total_classes: 0, used_classes: 0, available_classes: 0 }

  return { profile, bookings, groups, evaluations, assignments, payment, wallet }
}

// ─── Actualizar perfil ────────────────────────────────────────────────────────

const UpdateProfileSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone:     z.string().optional(),
  address:   z.string().optional(),
})

export async function updateOwnProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const parsed = UpdateProfileSchema.safeParse({
    full_name: formData.get('full_name'),
    phone:     (formData.get('phone') as string) || undefined,
    address:   (formData.get('address') as string) || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone:     parsed.data.phone ?? null,
      address:   parsed.data.address ?? null,
    })
    .eq('id', user.id)

  if (error) return { error: 'No se pudo guardar el perfil. Intenta de nuevo.' }

  revalidatePath('/player/profile')
  revalidatePath('/player/dashboard')
  return { error: null, success: 'Perfil actualizado correctamente.' }
}

export async function adminUpdateProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin()

  const targetId = formData.get('targetId') as string
  if (!z.string().uuid().safeParse(targetId).success) return { error: 'Usuario inválido' }

  const parsed = UpdateProfileSchema.safeParse({
    full_name: formData.get('full_name'),
    phone:     (formData.get('phone') as string) || undefined,
    address:   (formData.get('address') as string) || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone:     parsed.data.phone ?? null,
      address:   parsed.data.address ?? null,
    })
    .eq('id', targetId)

  if (error) {
    console.error('[adminUpdateProfileAction]', error)
    return { error: 'No se pudo guardar el perfil.' }
  }

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${targetId}`)
  return { error: null, success: 'Perfil actualizado.' }
}

// ─── Acciones admin ─────────────────────────────────────────────────────────────

const RoleSchema = z.enum(['admin', 'coach', 'player'])

export async function updateUserRole(id: string, role: UserRole): Promise<ActionState> {
  const { userId } = await requireAdmin()

  const parsed = RoleSchema.safeParse(role)
  if (!parsed.success) return { error: 'Rol inválido' }
  if (!z.string().uuid().safeParse(id).success) return { error: 'Usuario inválido' }

  if (id === userId) {
    return { error: 'No puedes cambiar tu propio rol (evita perder el acceso de admin).' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ role: parsed.data })
    .eq('id', id)

  if (error) {
    console.error('[updateUserRole]', error)
    return { error: 'No se pudo cambiar el rol.' }
  }

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${id}`)
  return { error: null, success: `Rol actualizado a ${parsed.data}.` }
}

export async function setUserActive(id: string, active: boolean): Promise<ActionState> {
  const { userId } = await requireAdmin()

  if (!z.string().uuid().safeParse(id).success) return { error: 'Usuario inválido' }
  if (id === userId) {
    return { error: 'No puedes desactivar tu propia cuenta.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ is_active: active })
    .eq('id', id)

  if (error) {
    console.error('[setUserActive]', error)
    return { error: 'No se pudo cambiar el estado de la cuenta.' }
  }

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${id}`)
  return { error: null, success: active ? 'Cuenta activada.' : 'Cuenta desactivada.' }
}
