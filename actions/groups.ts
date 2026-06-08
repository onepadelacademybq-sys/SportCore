'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { recordGroupIncome } from '@/actions/finances'
import { nextClassDate, addOneMonth, formatDate } from '@/lib/groups/billing'
import { createNotification } from '@/actions/notifications'

// ─── Shared types ──────────────────────────────────────────────────────────────

export type GroupActionState = { error: string | null; success?: string }

type ProfileRef    = { id: string; full_name: string; email: string }
type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type CourtRef   = { id: string; name: string }

export type GroupSchedule = {
  id: string
  day_of_week: number   // 0=Dom … 6=Sáb
  start_time: string    // "HH:MM:SS" desde la DB
  end_time: string
}

export type TrainingGroup = {
  id: string
  name: string
  coach_id: string
  coach: ProfileRef | null
  level: '5ta_masculino' | '6ta_masculino' | '7ma_masculino' | 'femenino_d' | 'femenino_c' | 'juvenil_s18' | 'juvenil_s16' | 'juvenil_s14' | 'prejuvenil' | 'baby_padel'
  max_capacity: number
  monthly_fee: string          // numeric devuelto como string por Supabase
  status: 'active' | 'paused' | 'closed'
  default_court_id: string | null
  default_court: CourtRef | null
  notes: string | null
  created_at: string
  schedules: GroupSchedule[]
  activeMemberCount: number
  waitlistCount: number
}

export type GroupMemberPaymentStatus = 'pending_payment' | 'paid' | 'confirmed' | 'overdue'

export type GroupMember = {
  id: string
  group_id: string
  player_id: string
  player: ProfileRef & { padel_level: string | null }
  status: 'active' | 'waitlist' | 'inactive' | 'pending_payment'
  payment_status: GroupMemberPaymentStatus | null
  payment_proof_url: string | null
  cycle_start_date: string | null
  next_payment_due: string | null
  monthly_fee: string | null
  late_fee_applied: boolean
  joined_at: string
  left_at: string | null
  notes: string | null
}

export type GroupPaymentRecord = {
  id: string
  player_id: string
  player: ProfileRef
  period_year: number
  period_month: number
  amount_due: string
  amount_paid: string
  status: 'pending' | 'paid' | 'partial' | 'overdue'
  payment_date: string | null
  notes: string | null
}

export type GroupFinancials = {
  activeMemberCount: number
  expectedMonthly: number
  collectedMonthly: number
  pendingCount: number
  overdueCount: number
  collectionRate: number  // 0–100
}

export type GroupSession = {
  id: string
  group_id: string
  coach_id: string | null
  court_id: string | null
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  notes: string | null
  court: { id: string; name: string } | null
}

// ─── Auth guards ───────────────────────────────────────────────────────────────

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  const profile = data as { id: string; role: string } | null
  if (!profile) redirect('/login')

  return { supabase, userId: user.id, role: profile.role }
}

async function requireAdmin() {
  const ctx = await requireAuth()
  if (ctx.role !== 'admin') redirect('/admin/dashboard')
  return ctx
}

// ─── Queries ───────────────────────────────────────────────────────────────────

/**
 * Grupos con conteo de miembros:
 *  - Admin: todos los grupos
 *  - Coach: solo los suyos
 */
export async function getGroups(): Promise<TrainingGroup[]> {
  const { supabase, userId, role } = await requireAuth()
  if (role === 'player') redirect('/player/groups')

  let query = supabase
    .from('training_groups')
    .select(`
      id, name, coach_id, level, max_capacity, monthly_fee, status,
      default_court_id, notes, created_at,
      coach:profiles!coach_id(id, full_name, email),
      default_court:courts!default_court_id(id, name),
      schedules:group_schedules(id, day_of_week, start_time, end_time),
      members:group_members(id, status)
    `)
    .order('name')

  if (role === 'coach') {
    query = query.eq('coach_id', userId)
  }

  const { data, error } = await query
  if (error) {
    console.error('[getGroups]', error)
    return []
  }

  return ((data ?? []) as any[]).map((g) => {
    const members = (g.members ?? []) as { status: string }[]
    return {
      ...g,
      activeMemberCount: members.filter((m) => m.status === 'active').length,
      waitlistCount:     members.filter((m) => m.status === 'waitlist').length,
    }
  }) as unknown as TrainingGroup[]
}

/** Detalle completo de un grupo (sin conteo de miembros, estos se obtienen con getGroupMembers) */
export async function getGroupById(groupId: string): Promise<TrainingGroup | null> {
  const { supabase, userId, role } = await requireAuth()

  const { data, error } = await supabase
    .from('training_groups')
    .select(`
      id, name, coach_id, level, max_capacity, monthly_fee, status,
      default_court_id, notes, created_at,
      coach:profiles!coach_id(id, full_name, email),
      default_court:courts!default_court_id(id, name),
      schedules:group_schedules(id, day_of_week, start_time, end_time),
      members:group_members(id, status)
    `)
    .eq('id', groupId)
    .single()

  if (error || !data) return null

  // Coaches solo ven sus propios grupos
  if (role === 'coach' && (data as any).coach_id !== userId) return null

  const members = ((data as any).members ?? []) as { status: string }[]

  return {
    ...(data as any),
    activeMemberCount: members.filter((m) => m.status === 'active').length,
    waitlistCount:     members.filter((m) => m.status === 'waitlist').length,
  } as unknown as TrainingGroup
}

/** Miembros activos y lista de espera de un grupo */
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { supabase } = await requireAuth()

  const { data, error } = await supabase
    .from('group_members')
    .select(`
      id, group_id, player_id, status, payment_status, payment_proof_url,
      cycle_start_date, next_payment_due, monthly_fee, late_fee_applied,
      joined_at, left_at, notes,
      player:profiles!player_id(id, full_name, email, padel_level)
    `)
    .eq('group_id', groupId)
    .neq('status', 'inactive')
    .order('joined_at', { ascending: true })

  if (error) console.error('[getGroupMembers]', error)
  return ((data ?? []) as any[]).filter((m) => m.player != null) as unknown as GroupMember[]
}

/** Registros de pago de un grupo para un mes específico */
export async function getGroupPayments(
  groupId: string,
  year: number,
  month: number,
): Promise<GroupPaymentRecord[]> {
  const { supabase } = await requireAuth()

  const { data, error } = await supabase
    .from('group_payments')
    .select(`
      id, player_id, period_year, period_month,
      amount_due, amount_paid, status, payment_date, notes,
      player:profiles!player_id(id, full_name, email)
    `)
    .eq('group_id', groupId)
    .eq('period_year', year)
    .eq('period_month', month)
    .order('player_id')

  if (error) console.error('[getGroupPayments]', error)
  return (data ?? []) as unknown as GroupPaymentRecord[]
}

/** Resumen financiero de un grupo para el mes actual */
export async function getGroupFinancials(
  groupId: string,
  year: number,
  month: number,
): Promise<GroupFinancials> {
  const { supabase } = await requireAuth()

  const [{ data: group }, { count: activeMemberCount }, { data: payments }] = await Promise.all([
    supabase
      .from('training_groups')
      .select('monthly_fee')
      .eq('id', groupId)
      .single(),
    supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('status', 'active'),
    supabase
      .from('group_payments')
      .select('amount_due, amount_paid, status')
      .eq('group_id', groupId)
      .eq('period_year', year)
      .eq('period_month', month),
  ])

  const fee           = Number((group as any)?.monthly_fee ?? 0)
  const activeCount   = activeMemberCount ?? 0
  const expectedMonthly   = fee * activeCount
  const collectedMonthly  = (payments ?? []).reduce((s, p) => s + Number(p.amount_paid), 0)
  const pendingCount  = (payments ?? []).filter((p) => p.status === 'pending').length
  const overdueCount  = (payments ?? []).filter((p) => p.status === 'overdue').length

  return {
    activeMemberCount: activeCount,
    expectedMonthly,
    collectedMonthly,
    pendingCount,
    overdueCount,
    collectionRate: expectedMonthly > 0 ? Math.round((collectedMonthly / expectedMonthly) * 100) : 0,
  }
}

/**
 * Grupos activos visibles para el jugador:
 * muestra cupos, horarios y estado de inscripción propia.
 */
export async function getAvailableGroups() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('training_groups')
    .select(`
      id, name, coach_id, level, max_capacity, monthly_fee, status, notes,
      coach:profiles!coach_id(id, full_name, email),
      schedules:group_schedules(id, day_of_week, start_time, end_time),
      members:group_members(id, status, player_id)
    `)
    .eq('status', 'active')
    .order('name')

  if (error) {
    console.error('[getAvailableGroups]', error)
    return []
  }

  return ((data ?? []) as any[]).map((g) => {
    const members = (g.members ?? []) as { status: string; player_id: string }[]
    const mine    = members.find((m) => m.player_id === user.id && m.status !== 'inactive')
    return {
      ...g,
      activeMemberCount: members.filter((m) => m.status === 'active' || m.status === 'pending_payment').length,
      waitlistCount:     members.filter((m) => m.status === 'waitlist').length,
      myStatus: mine?.status ?? null,
    }
  })
}

/** Lista de jugadores activos — para el formulario de inscripción del admin */
export async function getPlayersForEnroll(): Promise<{ id: string; full_name: string; email: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'player')
    .eq('is_active', true)
    .order('full_name')
  return (data ?? []) as { id: string; full_name: string; email: string }[]
}

/** Grupos en los que el jugador autenticado tiene membresía activa o en espera */
export async function getPlayerGroups() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('group_members')
    .select(`
      id, status, payment_status, payment_proof_url, joined_at,
      cycle_start_date, next_payment_due, monthly_fee, late_fee_applied,
      group:training_groups(
        id, name, level, monthly_fee, status, notes,
        coach:profiles!coach_id(id, full_name, email),
        schedules:group_schedules(id, day_of_week, start_time, end_time)
      )
    `)
    .eq('player_id', user.id)
    .neq('status', 'inactive')
    .order('joined_at', { ascending: false })

  if (error) console.error('[getPlayerGroups]', error)
  return (data ?? []) as unknown as {
    id: string
    status: 'active' | 'waitlist' | 'pending_payment'
    payment_status: GroupMemberPaymentStatus | null
    payment_proof_url: string | null
    cycle_start_date: string | null
    next_payment_due: string | null
    monthly_fee: string | null
    late_fee_applied: boolean
    joined_at: string
    group: Omit<TrainingGroup, 'activeMemberCount' | 'waitlistCount' | 'coach_id' | 'default_court_id' | 'default_court' | 'created_at' | 'members'>
  }[]
}

// ─── Validation schemas ────────────────────────────────────────────────────────

const LEVELS = [
  '5ta_masculino', '6ta_masculino', '7ma_masculino',
  'femenino_d', 'femenino_c',
  'juvenil_s18', 'juvenil_s16', 'juvenil_s14',
  'prejuvenil', 'baby_padel',
] as const

const GroupUpsertSchema = z.object({
  name:            z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  coachId:         z.string().uuid('Selecciona un entrenador válido'),
  level:           z.enum(LEVELS, { error: 'Nivel inválido' }),
  maxCapacity:     z.coerce.number().int().min(1, 'Mínimo 1 jugador').max(30, 'Máximo 30 jugadores'),
  monthlyFee:      z.coerce.number().min(0, 'La tarifa no puede ser negativa'),
  status:          z.enum(['active', 'paused', 'closed']).default('active'),
  defaultCourtId:  z.string().uuid().optional().or(z.literal('')),
  notes:           z.string().optional(),
  schedulesJson:   z.string().optional(),
})

// ─── Admin: crear grupo ────────────────────────────────────────────────────────

export async function createGroupAction(
  _prev: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const { supabase, userId } = await requireAdmin()

  const parsed = GroupUpsertSchema.safeParse({
    name:           formData.get('name'),
    coachId:        formData.get('coachId'),
    level:          formData.get('level'),
    maxCapacity:    formData.get('maxCapacity'),
    monthlyFee:     formData.get('monthlyFee'),
    status:         formData.get('status') || 'active',
    defaultCourtId: formData.get('defaultCourtId') || '',
    notes:          formData.get('notes') || undefined,
    schedulesJson:  formData.get('schedulesJson') || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, coachId, level, maxCapacity, monthlyFee, status, defaultCourtId, notes, schedulesJson } = parsed.data

  const { data: group, error: groupErr } = await supabase
    .from('training_groups')
    .insert({
      name,
      coach_id:         coachId,
      level,
      max_capacity:     maxCapacity,
      monthly_fee:      monthlyFee,
      status,
      default_court_id: defaultCourtId || null,
      notes:            notes || null,
    })
    .select('id')
    .single()

  if (groupErr || !group) {
    console.error('[createGroupAction]', groupErr)
    return { error: groupErr?.message ?? 'Error al crear el grupo. Intenta nuevamente.' }
  }

  // Insertar horarios y generar agenda de sesiones
  let parsedSchedules: { dayOfWeek: number; startTime: string; endTime: string }[] = []
  if (schedulesJson) {
    try {
      parsedSchedules = JSON.parse(schedulesJson)
      if (parsedSchedules.length > 0) {
        await supabase.from('group_schedules').insert(
          parsedSchedules.map((s) => ({
            group_id:    group.id,
            day_of_week: s.dayOfWeek,
            start_time:  s.startTime,
            end_time:    s.endTime,
          })),
        )
      }
    } catch {
      // Horarios inválidos — el grupo ya se creó, no bloqueamos
    }
  }

  // Generar sesiones del mes actual y siguiente automáticamente
  if (parsedSchedules.length > 0) {
    const groupRef: GroupRef = {
      id:              (group as { id: string }).id,
      name,
      coach_id:        coachId,
      default_court_id: defaultCourtId || null,
    }
    const scheduleRefs: ScheduleRef[] = parsedSchedules.map((s) => ({
      day_of_week: s.dayOfWeek,
      start_time:  s.startTime,
      end_time:    s.endTime,
    }))
    await generateGroupSessionsInternal(supabase, groupRef, scheduleRefs, userId)
  }

  revalidatePath('/admin/groups')
  return { error: null, success: `Grupo "${name}" creado correctamente.` }
}

// ─── Admin: editar grupo ───────────────────────────────────────────────────────

export async function updateGroupAction(
  _prev: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const { supabase } = await requireAdmin()

  const groupId = (formData.get('groupId') as string | null)?.trim()
  if (!groupId) return { error: 'ID de grupo requerido' }

  const parsed = GroupUpsertSchema.safeParse({
    name:           formData.get('name'),
    coachId:        formData.get('coachId'),
    level:          formData.get('level'),
    maxCapacity:    formData.get('maxCapacity'),
    monthlyFee:     formData.get('monthlyFee'),
    status:         formData.get('status') || 'active',
    defaultCourtId: formData.get('defaultCourtId') || '',
    notes:          formData.get('notes') || undefined,
    schedulesJson:  formData.get('schedulesJson') || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, coachId, level, maxCapacity, monthlyFee, status, defaultCourtId, notes, schedulesJson } = parsed.data

  const { error: updateErr } = await supabase
    .from('training_groups')
    .update({
      name,
      coach_id:         coachId,
      level,
      max_capacity:     maxCapacity,
      monthly_fee:      monthlyFee,
      status,
      default_court_id: defaultCourtId || null,
      notes:            notes || null,
    })
    .eq('id', groupId)

  if (updateErr) {
    console.error('[updateGroupAction]', updateErr)
    return { error: updateErr.message ?? 'Error al actualizar el grupo.' }
  }

  // Reemplazar horarios completo
  await supabase.from('group_schedules').delete().eq('group_id', groupId)

  if (schedulesJson) {
    try {
      const schedules: { dayOfWeek: number; startTime: string; endTime: string }[] = JSON.parse(schedulesJson)
      if (schedules.length > 0) {
        await supabase.from('group_schedules').insert(
          schedules.map((s) => ({
            group_id:    groupId,
            day_of_week: s.dayOfWeek,
            start_time:  s.startTime,
            end_time:    s.endTime,
          })),
        )
      }
    } catch {
      // Ignore schedule parse errors
    }
  }

  revalidatePath('/admin/groups')
  revalidatePath(`/admin/groups/${groupId}`)
  return { error: null, success: 'Grupo actualizado correctamente.' }
}

// ─── Admin: inscribir jugador ──────────────────────────────────────────────────

export async function enrollPlayerAction(
  _prev: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const { supabase } = await requireAdmin()

  const groupId  = (formData.get('groupId')  as string | null)?.trim()
  const playerId = (formData.get('playerId') as string | null)?.trim()

  if (!groupId || !playerId) return { error: 'Datos incompletos' }

  // Verificar que no esté ya inscrito o en espera
  const { data: existing } = await supabase
    .from('group_members')
    .select('id, status')
    .eq('group_id', groupId)
    .eq('player_id', playerId)
    .neq('status', 'inactive')
    .maybeSingle()

  if (existing) {
    return {
      error: existing.status === 'active'
        ? 'El jugador ya está inscrito en este grupo.'
        : 'El jugador ya está en la lista de espera.',
    }
  }

  // Cupo actual y capacidad máxima
  const [{ count: activeCount }, { data: group }] = await Promise.all([
    supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('status', 'active'),
    supabase
      .from('training_groups')
      .select('max_capacity, status')
      .eq('id', groupId)
      .single(),
  ])

  if (!group) return { error: 'Grupo no encontrado' }

  const status: 'active' | 'waitlist' =
    (activeCount ?? 0) < (group as any).max_capacity ? 'active' : 'waitlist'

  const { error } = await supabase.from('group_members').insert({
    group_id:  groupId,
    player_id: playerId,
    status,
  })

  if (error) {
    console.error('[enrollPlayerAction]', error)
    return { error: 'Error al inscribir al jugador.' }
  }

  revalidatePath('/admin/groups')
  revalidatePath(`/admin/groups/${groupId}`)
  return {
    error: null,
    success: status === 'active'
      ? 'Jugador inscrito en el grupo.'
      : 'Jugador añadido a la lista de espera.',
  }
}

// ─── Admin: dar de baja a jugador (y promover lista de espera) ─────────────────

export async function removePlayerAction(
  _prev: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const { supabase } = await requireAdmin()

  const memberId = (formData.get('memberId') as string | null)?.trim()
  if (!memberId) return { error: 'ID de miembro requerido' }

  const { data: member } = await supabase
    .from('group_members')
    .select('id, group_id, player_id, status')
    .eq('id', memberId)
    .single()

  const m = member as { id: string; group_id: string; player_id: string; status: string } | null
  if (!m) return { error: 'Miembro no encontrado' }

  const { error } = await supabase
    .from('group_members')
    .update({ status: 'inactive', left_at: new Date().toISOString() })
    .eq('id', memberId)

  if (error) return { error: 'Error al dar de baja al jugador.' }

  // Si era activo o pending_payment, promover el primero de la lista de espera
  if (m.status === 'active' || m.status === 'pending_payment') {
    const { data: nextInLine } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', m.group_id)
      .eq('status', 'waitlist')
      .order('joined_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (nextInLine) {
      await supabase
        .from('group_members')
        .update({ status: 'pending_payment', payment_status: 'pending_payment' })
        .eq('id', (nextInLine as { id: string }).id)
    }
  }

  revalidatePath('/admin/groups')
  revalidatePath('/player/groups')
  revalidatePath(`/admin/groups/${m.group_id}`)
  return { error: null, success: 'Jugador dado de baja. Lista de espera actualizada.' }
}

// ─── Admin: registrar pago mensual de un jugador ───────────────────────────────

const RecordPaymentSchema = z.object({
  groupId:     z.string().uuid(),
  playerId:    z.string().uuid(),
  periodYear:  z.coerce.number().int().min(2024).max(2035),
  periodMonth: z.coerce.number().int().min(1).max(12),
  amountPaid:  z.coerce.number().min(0),
  paymentDate: z.string().optional(),
  notes:       z.string().optional(),
})

export async function recordPaymentAction(
  _prev: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const { supabase, userId } = await requireAdmin()

  const parsed = RecordPaymentSchema.safeParse({
    groupId:     formData.get('groupId'),
    playerId:    formData.get('playerId'),
    periodYear:  formData.get('periodYear'),
    periodMonth: formData.get('periodMonth'),
    amountPaid:  formData.get('amountPaid'),
    paymentDate: formData.get('paymentDate') || undefined,
    notes:       formData.get('notes') || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { groupId, playerId, periodYear, periodMonth, amountPaid, paymentDate, notes } = parsed.data

  // Buscar registro existente o crear uno nuevo
  const { data: existing } = await supabase
    .from('group_payments')
    .select('id, amount_due, amount_paid')
    .eq('group_id', groupId)
    .eq('player_id', playerId)
    .eq('period_year', periodYear)
    .eq('period_month', periodMonth)
    .maybeSingle()

  const today = new Date().toISOString().split('T')[0]
  const txDate = paymentDate || today
  // Delta del pago → ingreso de grupo (evita doble conteo en pagos parciales)
  const previousPaid = existing ? Number((existing as any).amount_paid) : 0
  const incomeDelta  = amountPaid - previousPaid

  if (existing) {
    const due    = Number((existing as any).amount_due)
    const status = amountPaid <= 0 ? 'pending' : amountPaid >= due ? 'paid' : 'partial'

    const { error } = await supabase
      .from('group_payments')
      .update({
        amount_paid:  amountPaid,
        status,
        payment_date: paymentDate || today,
        notes:        notes || null,
      })
      .eq('id', (existing as any).id)

    if (error) return { error: 'Error al actualizar el pago.' }
  } else {
    // Obtener la tarifa del grupo para rellenar amount_due
    const { data: group } = await supabase
      .from('training_groups')
      .select('monthly_fee')
      .eq('id', groupId)
      .single()

    if (!group) return { error: 'Grupo no encontrado' }

    const fee    = Number((group as any).monthly_fee)
    const status = amountPaid <= 0 ? 'pending' : amountPaid >= fee ? 'paid' : 'partial'

    const { error } = await supabase.from('group_payments').insert({
      group_id:     groupId,
      player_id:    playerId,
      period_year:  periodYear,
      period_month: periodMonth,
      amount_due:   fee,
      amount_paid:  amountPaid,
      status,
      payment_date: paymentDate || today,
      notes:        notes || null,
    })

    if (error) {
      console.error('[recordPaymentAction]', error)
      return { error: 'Error al registrar el pago.' }
    }
  }

  // Registrar el ingreso de grupo por el incremento del pago
  await recordGroupIncome(supabase, {
    groupId,
    amount: incomeDelta,
    periodYear,
    periodMonth,
    date: txDate,
    userId,
  })

  revalidatePath('/admin/groups')
  revalidatePath(`/admin/groups/${groupId}`)
  return { error: null, success: 'Pago registrado correctamente.' }
}

// ─── Admin: generar cobros pendientes para un mes completo ────────────────────

export async function generateMonthlyPaymentsAction(
  _prev: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const { supabase } = await requireAdmin()

  const groupId     = (formData.get('groupId')     as string | null)?.trim()
  const periodYear  = parseInt(formData.get('periodYear')  as string, 10)
  const periodMonth = parseInt(formData.get('periodMonth') as string, 10)

  if (!groupId || isNaN(periodYear) || isNaN(periodMonth)) return { error: 'Datos incompletos' }

  // Grupo + miembros activos
  const [{ data: group }, { data: activeMembers }] = await Promise.all([
    supabase.from('training_groups').select('monthly_fee').eq('id', groupId).single(),
    supabase
      .from('group_members')
      .select('player_id')
      .eq('group_id', groupId)
      .eq('status', 'active'),
  ])

  if (!group) return { error: 'Grupo no encontrado' }
  if (!activeMembers || activeMembers.length === 0) return { error: 'No hay jugadores activos en este grupo.' }

  const fee  = Number((group as any).monthly_fee)
  const rows = (activeMembers as { player_id: string }[]).map((m) => ({
    group_id:     groupId,
    player_id:    m.player_id,
    period_year:  periodYear,
    period_month: periodMonth,
    amount_due:   fee,
    amount_paid:  0,
    status:       'pending',
  }))

  // ignoreDuplicates para no sobreescribir pagos ya existentes
  const { error } = await supabase
    .from('group_payments')
    .upsert(rows, { onConflict: 'group_id,player_id,period_year,period_month', ignoreDuplicates: true })

  if (error) {
    console.error('[generateMonthlyPaymentsAction]', error)
    return { error: 'Error al generar los cobros.' }
  }

  revalidatePath('/admin/groups')
  revalidatePath(`/admin/groups/${groupId}`)
  return {
    error: null,
    success: `Cobros de ${periodMonth}/${periodYear} generados para ${rows.length} jugador${rows.length !== 1 ? 'es' : ''}.`,
  }
}

// ─── Jugador: solicitar inscripción ────────────────────────────────────────────

export async function requestGroupEnrollmentAction(
  _prev: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const groupId = (formData.get('groupId') as string | null)?.trim()
  if (!groupId) return { error: 'Grupo no especificado' }

  // ¿Ya inscrito o en espera?
  const { data: existing } = await supabase
    .from('group_members')
    .select('id, status')
    .eq('group_id', groupId)
    .eq('player_id', user.id)
    .neq('status', 'inactive')
    .maybeSingle()

  if (existing) {
    const st = (existing as any).status
    return {
      error: st === 'active'
        ? 'Ya estás inscrito en este grupo.'
        : st === 'pending_payment'
          ? 'Ya tienes una inscripción pendiente de pago en este grupo.'
          : 'Ya estás en la lista de espera de este grupo.',
    }
  }

  // Verificar que el grupo existe y está activo
  const { data: group } = await supabase
    .from('training_groups')
    .select('id, name, status, max_capacity, monthly_fee')
    .eq('id', groupId)
    .single()

  const g = group as { id: string; name: string; status: string; max_capacity: number; monthly_fee: string } | null
  if (!g || g.status !== 'active') return { error: 'El grupo no está disponible.' }

  const { count: occupiedCount } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .in('status', ['active', 'pending_payment'])

  const status: 'pending_payment' | 'waitlist' =
    (occupiedCount ?? 0) < g.max_capacity ? 'pending_payment' : 'waitlist'

  const { error } = await supabase
    .from('group_members')
    .upsert(
      {
        group_id: groupId,
        player_id: user.id,
        status,
        payment_status: status === 'pending_payment' ? 'pending_payment' : null,
        monthly_fee:    status === 'pending_payment' ? Number(g.monthly_fee) : null,
        left_at: null,
        joined_at: new Date().toISOString(),
      },
      { onConflict: 'group_id,player_id', ignoreDuplicates: false },
    )

  if (error) {
    console.error('[requestGroupEnrollmentAction]', error)
    return { error: 'Error al procesar la solicitud.' }
  }

  revalidatePath('/player/groups')
  return {
    error: null,
    success: status === 'pending_payment'
      ? `Cupo reservado en "${g.name}". Completa el pago para confirmar tu inscripción.`
      : `Solicitud enviada. Estás en lista de espera de "${g.name}".`,
  }
}

// ─── Jugador: cancelar su propia inscripción ────────────────────────────────

export async function cancelMyEnrollmentAction(
  _prev: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const memberId = (formData.get('memberId') as string | null)?.trim()
  if (!memberId) return { error: 'ID de membresía requerido' }

  // Verificar que la membresía pertenece a este jugador
  const { data: member } = await supabase
    .from('group_members')
    .select('id, group_id, player_id, status')
    .eq('id', memberId)
    .eq('player_id', user.id)
    .single()

  const m = member as { id: string; group_id: string; player_id: string; status: string } | null
  if (!m) return { error: 'Membresía no encontrada.' }

  const { error } = await supabase
    .from('group_members')
    .update({ status: 'inactive', left_at: new Date().toISOString() })
    .eq('id', memberId)

  if (error) return { error: 'Error al cancelar la inscripción.' }

  // Si tenía un cupo (activo o pending_payment), promover el primero de la lista de espera
  if (m.status === 'active' || m.status === 'pending_payment') {
    const { data: nextInLine } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', m.group_id)
      .eq('status', 'waitlist')
      .order('joined_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (nextInLine) {
      await supabase
        .from('group_members')
        .update({ status: 'pending_payment', payment_status: 'pending_payment' })
        .eq('id', (nextInLine as { id: string }).id)
    }
  }

  revalidatePath('/player/groups')
  return { error: null, success: 'Inscripción cancelada correctamente.' }
}

// ─── Jugador: subir comprobante de pago de inscripción ─────────────────────

const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_PROOF_SIZE = 5 * 1024 * 1024

export async function uploadGroupProofAction(
  _prev: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const memberId = (formData.get('memberId') as string | null)?.trim()
  if (!memberId) return { error: 'ID de membresía requerido' }

  const file = formData.get('paymentProof') as File | null
  if (!file || file.size === 0) return { error: 'Selecciona un comprobante de pago' }
  if (!ALLOWED_PROOF_TYPES.includes(file.type))
    return { error: 'Solo se aceptan archivos JPG, PNG o PDF' }
  if (file.size > MAX_PROOF_SIZE)
    return { error: 'El archivo no puede superar 5 MB' }

  const { data: member } = await supabase
    .from('group_members')
    .select('id, player_id, group_id, status')
    .eq('id', memberId)
    .eq('player_id', user.id)
    .single()

  const m = member as { id: string; player_id: string; group_id: string; status: string } | null
  if (!m) return { error: 'Membresía no encontrada.' }
  if (m.status !== 'pending_payment')
    return { error: 'Solo se puede subir comprobante para inscripciones pendientes de pago.' }

  const ext    = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg'
  const path   = `groups/${memberId}.${ext}`
  const buffer = await file.arrayBuffer()
  const admin  = createAdminClient()

  const { error: uploadError } = await admin.storage
    .from('payment-proofs')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    console.error('[uploadGroupProofAction] storage:', uploadError)
    return { error: 'Error al subir el archivo. Intenta nuevamente.' }
  }

  const { error: dbError } = await supabase
    .from('group_members')
    .update({ payment_proof_url: path, payment_status: 'paid' })
    .eq('id', memberId)

  if (dbError) return { error: 'Error al actualizar la inscripción.' }

  revalidatePath('/player/groups')
  return { error: null, success: 'Comprobante enviado. El administrador verificará el pago.' }
}

// ─── Admin: confirmar pago de inscripción ───────────────────────────────────

export async function confirmGroupPaymentAction(
  _prev: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const { supabase } = await requireAdmin()

  const memberId = (formData.get('memberId') as string | null)?.trim()
  if (!memberId) return { error: 'ID de membresía requerido' }

  const { data: member } = await supabase
    .from('group_members')
    .select('id, group_id, player_id, status, next_payment_due')
    .eq('id', memberId)
    .single()

  const m = member as { id: string; group_id: string; player_id: string; status: string; next_payment_due: string | null } | null
  if (!m) return { error: 'Membresía no encontrada.' }

  // Calcular ciclo de pago anclado a la próxima clase
  const { data: schedulesData } = await supabase
    .from('group_schedules')
    .select('day_of_week')
    .eq('group_id', m.group_id)

  const schedules = (schedulesData ?? []) as { day_of_week: number }[]
  const now        = new Date()
  const cycleStart = nextClassDate(schedules, now)
  const nextDue    = addOneMonth(cycleStart)

  // Mora: si había una fecha de vencimiento previa y ya pasó el período de gracia
  const isLate = m.next_payment_due
    ? now > new Date(new Date(m.next_payment_due).getTime() + 4 * 24 * 60 * 60 * 1000)
    : false

  const { error } = await supabase
    .from('group_members')
    .update({
      status:           'active',
      payment_status:   'confirmed',
      cycle_start_date: formatDate(cycleStart),
      next_payment_due: formatDate(nextDue),
      late_fee_applied: isLate,
    })
    .eq('id', memberId)

  if (error) return { error: 'Error al confirmar el pago.' }

  await createNotification(
    m.player_id,
    'Pago de grupo confirmado',
    'Tu pago de inscripción fue confirmado. Ya eres parte activa del grupo.',
    'payment_processed',
    '/player/groups',
  )

  revalidatePath('/admin/groups')
  revalidatePath(`/admin/groups/${m.group_id}`)
  revalidatePath('/player/groups')
  return { error: null, success: 'Pago confirmado. Jugador activado.' }
}

// ─── Admin: rechazar comprobante de inscripción ─────────────────────────────

export async function rejectGroupPaymentAction(
  _prev: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const { supabase } = await requireAdmin()

  const memberId = (formData.get('memberId') as string | null)?.trim()
  if (!memberId) return { error: 'ID de membresía requerido' }

  const { data: member } = await supabase
    .from('group_members')
    .select('id, group_id, payment_proof_url')
    .eq('id', memberId)
    .single()

  const m = member as { id: string; group_id: string; payment_proof_url: string | null } | null
  if (!m) return { error: 'Membresía no encontrada.' }

  if (m.payment_proof_url) {
    const admin = createAdminClient()
    await admin.storage.from('payment-proofs').remove([m.payment_proof_url])
  }

  const { error } = await supabase
    .from('group_members')
    .update({ payment_proof_url: null, payment_status: 'pending_payment' })
    .eq('id', memberId)

  if (error) return { error: 'Error al rechazar el comprobante.' }

  revalidatePath('/admin/groups')
  revalidatePath(`/admin/groups/${m.group_id}`)
  revalidatePath('/player/groups')
  return { error: null, success: 'Comprobante rechazado. El jugador puede volver a enviar.' }
}

// ─── Agenda de sesiones grupales ───────────────────────────────────────────────

// Devuelve todas las fechas de un mes que coinciden con un día de la semana (0=Dom)
function datesInMonth(year: number, month: number, dayOfWeek: number): Date[] {
  const dates: Date[] = []
  const d = new Date(year, month - 1, 1)
  while (d.getMonth() === month - 1) {
    if (d.getDay() === dayOfWeek) dates.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

// Combina una fecha y un string "HH:MM:SS" → ISO 8601 con offset Colombia (UTC-5).
// El sufijo -05:00 es obligatorio: sin él PostgreSQL interpreta el string como UTC,
// almacenando el horario 5 horas antes de lo que el entrenador configuró.
function toDateTime(date: Date, timeStr: string): string {
  const [h, m, s] = timeStr.split(':').map(Number)
  const pad = (n: number) => String(Math.floor(n)).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(h)}:${pad(m)}:${pad(s ?? 0)}-05:00`
}

type GroupRef = { id: string; name: string; coach_id: string; default_court_id: string | null }
type ScheduleRef = { day_of_week: number; start_time: string; end_time: string }

async function insertSessionsForMonth(
  supabase: SupabaseClient,
  group: GroupRef,
  schedules: ScheduleRef[],
  year: number,
  month: number,
  adminId: string,
): Promise<number> {
  if (!schedules.length) return 0

  const pad = (n: number) => String(n).padStart(2, '0')
  const monthStart = `${year}-${pad(month)}-01T00:00:00`
  const nextY = month === 12 ? year + 1 : year
  const nextM = month === 12 ? 1 : month + 1
  const monthEnd = `${nextY}-${pad(nextM)}-01T00:00:00`

  // Evitar duplicados chequeando qué slots ya existen en ese mes
  const { data: existing } = await supabase
    .from('bookings')
    .select('start_time')
    .eq('group_id', group.id)
    .gte('start_time', monthStart)
    .lt('start_time', monthEnd)

  // Normalizar a UTC para comparar: "2026-06-09T07:00:00-05:00" y "2026-06-09T12:00:00Z"
  // representan el mismo instante → slice(0,16) sobre el ISO UTC es el identificador único.
  const seen = new Set(
    (existing ?? []).map((b: any) => new Date(b.start_time as string).toISOString().slice(0, 16)),
  )

  const rows: Record<string, unknown>[] = []
  for (const sched of schedules) {
    for (const date of datesInMonth(year, month, sched.day_of_week)) {
      const startIso = toDateTime(date, sched.start_time)
      const endIso   = toDateTime(date, sched.end_time)
      if (!seen.has(new Date(startIso).toISOString().slice(0, 16))) {
        rows.push({
          group_id:   group.id,
          coach_id:   group.coach_id,
          court_id:   group.default_court_id,
          created_by: adminId,
          start_time: startIso,
          end_time:   endIso,
          status:     'pending',
          notes:      `Clase grupal - ${group.name}`,
          price:      0,
        })
        seen.add(new Date(startIso).toISOString().slice(0, 16))
      }
    }
  }

  if (!rows.length) return 0
  const { error } = await supabase.from('bookings').insert(rows)
  if (error) console.error('[insertSessionsForMonth]', error)
  return rows.length
}

/** Genera sesiones para el mes actual + siguiente. Lllamada internamente al crear el grupo. */
async function generateGroupSessionsInternal(
  supabase: SupabaseClient,
  group: GroupRef,
  schedules: ScheduleRef[],
  adminId: string,
): Promise<number> {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth() + 1
  const ny = m === 12 ? y + 1 : y
  const nm = m === 12 ? 1 : m + 1
  return (
    (await insertSessionsForMonth(supabase, group, schedules, y, m, adminId)) +
    (await insertSessionsForMonth(supabase, group, schedules, ny, nm, adminId))
  )
}

/** Admin: (re)generar sesiones del grupo para el mes actual y siguiente */
export async function generateGroupSessionsAction(
  _prev: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const { supabase, userId } = await requireAdmin()

  const groupId = (formData.get('groupId') as string | null)?.trim()
  if (!groupId) return { error: 'ID de grupo requerido' }

  const { data: group } = await supabase
    .from('training_groups')
    .select('id, name, coach_id, default_court_id, schedules:group_schedules(day_of_week, start_time, end_time)')
    .eq('id', groupId)
    .single()

  if (!group) return { error: 'Grupo no encontrado' }

  const schedules = ((group as any).schedules ?? []) as ScheduleRef[]
  if (!schedules.length) return { error: 'El grupo no tiene horarios definidos.' }

  const count = await generateGroupSessionsInternal(supabase, group as any, schedules, userId)

  revalidatePath(`/admin/groups/${groupId}`)
  return {
    error: null,
    success: count > 0
      ? `${count} sesiones generadas correctamente.`
      : 'No se generaron sesiones (ya existen para esos meses).',
  }
}

/** Admin/Coach: todas las sesiones de un grupo */
export async function getGroupSessions(groupId: string): Promise<GroupSession[]> {
  const { supabase } = await requireAuth()

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id, group_id, coach_id, court_id, start_time, end_time, status, notes,
      court:courts!court_id(id, name)
    `)
    .eq('group_id', groupId)
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true })

  if (error) console.error('[getGroupSessions]', error)
  return (data ?? []) as unknown as GroupSession[]
}

/** Próximas sesiones confirmadas de un grupo — para jugadores inscritos */
export async function getUpcomingGroupSessions(groupId: string): Promise<GroupSession[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id, group_id, coach_id, court_id, start_time, end_time, status, notes,
      court:courts!court_id(id, name)
    `)
    .eq('group_id', groupId)
    .eq('status', 'confirmed')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(8)

  if (error) console.error('[getUpcomingGroupSessions]', error)
  return (data ?? []) as unknown as GroupSession[]
}

/** Admin: confirmar una sesión (p.ej. tras reprogramar o si se creó como pending) */
export async function confirmGroupSessionAction(
  _prev: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const { supabase } = await requireAdmin()

  const sessionId = (formData.get('sessionId') as string | null)?.trim()
  if (!sessionId) return { error: 'ID de sesión requerido' }

  const { data: session } = await supabase
    .from('bookings')
    .select('group_id')
    .eq('id', sessionId)
    .single()

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', sessionId)

  if (error) return { error: 'Error al confirmar la sesión.' }

  if (session) {
    revalidatePath(`/admin/groups/${(session as any).group_id}`)
    revalidatePath('/coach/groups')
  }
  return { error: null, success: 'Sesión confirmada.' }
}

/** Admin: cancelar una sesión (libera el horario del entrenador) */
export async function cancelGroupSessionAction(
  _prev: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const { supabase } = await requireAdmin()

  const sessionId = (formData.get('sessionId') as string | null)?.trim()
  if (!sessionId) return { error: 'ID de sesión requerido' }

  const { data: session } = await supabase
    .from('bookings')
    .select('group_id')
    .eq('id', sessionId)
    .single()

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', sessionId)

  if (error) return { error: 'Error al cancelar la sesión.' }

  if (session) {
    revalidatePath(`/admin/groups/${(session as any).group_id}`)
    revalidatePath('/coach/groups')
    revalidatePath('/player/groups')
  }
  return { error: null, success: 'Sesión cancelada. El horario del entrenador queda libre.' }
}

/** Llama al cargar la agenda: si quedan < 14 días de sesiones futuras, genera el mes siguiente */
export async function ensureFutureGroupSessions(groupId: string): Promise<void> {
  const { supabase, userId, role } = await requireAuth()
  if (role !== 'admin') return

  const { data: last } = await supabase
    .from('bookings')
    .select('start_time')
    .eq('group_id', groupId)
    .in('status', ['confirmed', 'pending'])
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastDate     = last ? new Date((last as any).start_time) : new Date()
  const twoWeeksOut  = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

  if (lastDate > twoWeeksOut) return

  // La última sesión está dentro de 2 semanas → generar el mes siguiente
  const pivot      = lastDate > new Date() ? lastDate : new Date()
  const targetYear = pivot.getMonth() === 11 ? pivot.getFullYear() + 1 : pivot.getFullYear()
  const targetMonth = pivot.getMonth() === 11 ? 1 : pivot.getMonth() + 2 // getMonth() es 0-indexed

  const { data: group } = await supabase
    .from('training_groups')
    .select('id, name, coach_id, default_court_id, schedules:group_schedules(day_of_week, start_time, end_time)')
    .eq('id', groupId)
    .single()

  if (!group) return
  const schedules = ((group as any).schedules ?? []) as ScheduleRef[]
  await insertSessionsForMonth(supabase, group as any, schedules, targetYear, targetMonth, userId)
  revalidatePath(`/admin/groups/${groupId}`)
}

// ─── Admin: eliminar grupo ─────────────────────────────────────────────────────

export async function deleteGroupAction(
  _prev: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const { supabase } = await requireAdmin()

  const groupId = (formData.get('groupId') as string | null)?.trim()
  if (!groupId) return { error: 'ID de grupo requerido' }

  // Eliminar en orden para respetar FKs
  await supabase.from('bookings').delete().eq('group_id', groupId)
  await supabase.from('group_payments').delete().eq('group_id', groupId)
  await supabase.from('group_members').delete().eq('group_id', groupId)
  await supabase.from('group_schedules').delete().eq('group_id', groupId)

  const { error } = await supabase.from('training_groups').delete().eq('id', groupId)
  if (error) {
    console.error('[deleteGroupAction]', error)
    return { error: 'Error al eliminar el grupo.' }
  }

  revalidatePath('/admin/groups')
  redirect('/admin/groups')
}

// ─── URL firmada para comprobante de pago de grupo ─────────────────────────

export async function getGroupProofUrl(memberId: string, storagePath: string): Promise<string | null> {
  const { supabase, userId, role } = await requireAuth()

  if (role !== 'admin') {
    const { data } = await supabase
      .from('group_members')
      .select('player_id')
      .eq('id', memberId)
      .single()
    if (!data || (data as { player_id: string }).player_id !== userId) return null
  }

  const admin = createAdminClient()
  const { data } = await admin.storage
    .from('payment-proofs')
    .createSignedUrl(storagePath, 60 * 60)

  return data?.signedUrl ?? null
}
