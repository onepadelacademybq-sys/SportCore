'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { recordGroupIncome } from '@/actions/finances'

// ─── Shared types ──────────────────────────────────────────────────────────────

export type GroupActionState = { error: string | null; success?: string }

type ProfileRef = { id: string; full_name: string; email: string }
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

export type GroupMember = {
  id: string
  group_id: string
  player_id: string
  player: ProfileRef & { padel_level: string | null }
  status: 'active' | 'waitlist' | 'inactive'
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
      id, group_id, player_id, status, joined_at, left_at, notes,
      player:profiles!player_id(id, full_name, email, padel_level)
    `)
    .eq('group_id', groupId)
    .neq('status', 'inactive')
    .order('status')                              // active primero, luego waitlist
    .order('joined_at', { ascending: true })

  if (error) console.error('[getGroupMembers]', error)
  return (data ?? []) as unknown as GroupMember[]
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
      activeMemberCount: members.filter((m) => m.status === 'active').length,
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
      id, status, joined_at,
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
    status: 'active' | 'waitlist'
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
  const { supabase } = await requireAdmin()

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

  // Insertar horarios si se proporcionaron
  if (schedulesJson) {
    try {
      const schedules: { dayOfWeek: number; startTime: string; endTime: string }[] = JSON.parse(schedulesJson)
      if (schedules.length > 0) {
        await supabase.from('group_schedules').insert(
          schedules.map((s) => ({
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

  // Si era activo, promover el primero de la lista de espera
  if (m.status === 'active') {
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
        .update({ status: 'active' })
        .eq('id', (nextInLine as { id: string }).id)
    }
  }

  revalidatePath('/admin/groups')
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
    return {
      error: (existing as any).status === 'active'
        ? 'Ya estás inscrito en este grupo.'
        : 'Ya estás en la lista de espera de este grupo.',
    }
  }

  // Verificar que el grupo existe y está activo
  const { data: group } = await supabase
    .from('training_groups')
    .select('id, name, status, max_capacity')
    .eq('id', groupId)
    .single()

  const g = group as { id: string; name: string; status: string; max_capacity: number } | null
  if (!g || g.status !== 'active') return { error: 'El grupo no está disponible.' }

  const { count: activeCount } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('status', 'active')

  const status: 'active' | 'waitlist' =
    (activeCount ?? 0) < g.max_capacity ? 'active' : 'waitlist'

  const { error } = await supabase.from('group_members').insert({
    group_id:  groupId,
    player_id: user.id,
    status,
  })

  if (error) {
    console.error('[requestGroupEnrollmentAction]', error)
    return { error: 'Error al procesar la solicitud.' }
  }

  revalidatePath('/player/groups')
  return {
    error: null,
    success: status === 'active'
      ? `¡Te has inscrito en "${g.name}"!`
      : `Solicitud enviada. Estás en lista de espera de "${g.name}".`,
  }
}
