'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth as requireAuthShared } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createNotification } from '@/actions/notifications'
import { colombiaLocalToISO } from '@/lib/format'
import { PADEL_LEVELS } from '@/lib/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrainingState = { error: string | null; success?: string; id?: string }

export type BlockExercise = {
  id:          string
  order:       number
  repetitions: string | null
  notes:       string | null
  exercise: {
    id:                    string
    name:                  string
    theme:                 string
    estimated_duration_min: number
    objective:             string
  }
}

export type SessionBlock = {
  id:          string
  block_type:  'calentamiento' | 'central' | 'vuelta_a_la_calma'
  order:       number
  duration_min: number
  notes:       string | null
  exercises:   BlockExercise[]
}

export type ConfirmedBooking = {
  id:         string
  start_time: string
  end_time:   string
  court_name: string | null
}

export type TrainingSession = {
  id:           string
  microcycle_id: string
  scheduled_at: string
  duration_min: number
  status:       'scheduled' | 'completed' | 'cancelled'
  coach_notes:  string | null
  blocks:       SessionBlock[]
}

export type Microcycle = {
  id:              string
  mesocycle_id:    string
  week_number:     number
  weekly_objective: string | null
  sessions:        TrainingSession[]
}

export type Mesocycle = {
  id:               string
  created_by:       string
  macrocycle_id?:   string | null
  name:             string
  general_objective: string
  level:            string
  duration_weeks:   number
  status:           'draft' | 'active' | 'completed' | 'archived'
  start_date:       string | null
  end_date:         string | null
  created_at:       string
  creator:          { id: string; full_name: string } | null
  microcycles:      Microcycle[]
  assignments:      MesocycleAssignment[]
}

export type Macrocycle = {
  id:               string
  created_by:       string
  name:             string
  general_objective: string | null
  status:           'draft' | 'active' | 'completed' | 'archived'
  start_date:       string | null
  end_date:         string | null
  created_at:       string
  creator:          { id: string; full_name: string } | null
  mesocycle_count?: number
  mesocycles?:      Mesocycle[]
}

export type MesocycleAssignment = {
  id:          string
  mesocycle_id: string
  player_id:   string | null
  group_id:    string | null
  assigned_at: string
  player:      { id: string; full_name: string } | null
  group:       { id: string; name: string } | null
}

// ─── Notification helper ──────────────────────────────────────────────────────

async function notifyMesocyclePlayers(
  mesocycleId: string,
  title: string,
  body: string,
): Promise<void> {
  const admin = createAdminClient()

  const { data: assignments, error: assignErr } = await admin
    .from('mesocycle_assignments')
    .select('player_id, group_id')
    .eq('mesocycle_id', mesocycleId)

  if (assignErr) {
    console.error('[notifyMesocyclePlayers] assignments query failed:', assignErr)
    return
  }

  if (!assignments || assignments.length === 0) {
    console.log('[notifyMesocyclePlayers] no assignments for mesocycle', mesocycleId)
    return
  }

  const playerIds = new Set<string>()
  const groupIds: string[] = []

  for (const a of assignments as { player_id: string | null; group_id: string | null }[]) {
    if (a.player_id) playerIds.add(a.player_id)
    if (a.group_id)  groupIds.push(a.group_id)
  }

  if (groupIds.length > 0) {
    const { data: members, error: membersErr } = await admin
      .from('group_members')
      .select('player_id')
      .in('group_id', groupIds)
      .eq('status', 'active')

    if (membersErr) {
      console.error('[notifyMesocyclePlayers] group_members query failed:', membersErr)
    }

    for (const m of (members ?? []) as { player_id: string }[]) {
      playerIds.add(m.player_id)
    }
  }

  console.log(`[notifyMesocyclePlayers] notifying ${playerIds.size} player(s) for mesocycle ${mesocycleId}`)

  await Promise.all(
    Array.from(playerIds).map((id) =>
      createNotification(id, title, body, 'session_assigned', '/player/my-trainings'),
    ),
  )
}

// ─── Auth guards ──────────────────────────────────────────────────────────────

async function requireCoachOrAdmin() {
  const ctx = await requireAuthShared()
  if (ctx.role === 'player') redirect('/player/dashboard')
  return ctx
}

// Resuelve el dueño (created_by) del mesociclo padre desde cualquier nivel de la jerarquía.
// El `any` queda contenido acá: el tipado anidado de los joins de Supabase no aporta seguridad real.
type OwnableEntity = 'microcycle' | 'session' | 'block' | 'blockExercise'

const OWNER_QUERY: Record<OwnableEntity, { table: string; select: string; owner: (d: any) => string | undefined }> = {
  microcycle: {
    table:  'microcycles',
    select: 'mesocycle:mesocycles!mesocycle_id(created_by)',
    owner:  (d) => d?.mesocycle?.created_by,
  },
  session: {
    table:  'training_sessions',
    select: 'microcycle:microcycles!microcycle_id(mesocycle:mesocycles!mesocycle_id(created_by))',
    owner:  (d) => d?.microcycle?.mesocycle?.created_by,
  },
  block: {
    table:  'session_blocks',
    select: 'session:training_sessions!session_id(microcycle:microcycles!microcycle_id(mesocycle:mesocycles!mesocycle_id(created_by)))',
    owner:  (d) => d?.session?.microcycle?.mesocycle?.created_by,
  },
  blockExercise: {
    table:  'session_block_exercises',
    select: 'block:session_blocks!block_id(session:training_sessions!session_id(microcycle:microcycles!microcycle_id(mesocycle:mesocycles!mesocycle_id(created_by))))',
    owner:  (d) => d?.block?.session?.microcycle?.mesocycle?.created_by,
  },
}

/** Verifica que el coach sea dueño del mesociclo al que pertenece la entidad.
 *  Admins siempre pasan. Devuelve un error listo para retornar, o null si tiene permiso. */
async function assertMesocycleOwner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  role: string,
  userId: string,
  entity: OwnableEntity,
  id: string,
): Promise<{ error: string } | null> {
  if (role === 'admin') return null
  const q = OWNER_QUERY[entity]
  const { data } = await supabase.from(q.table).select(q.select).eq('id', id).single()
  return q.owner(data) === userId ? null : { error: 'Sin permisos' }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Lista de mesociclos. Admin ve todos; coach solo los suyos. */
export async function getMesocycles(): Promise<Mesocycle[]> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  let query = supabase
    .from('mesocycles')
    .select(`
      id, created_by, macrocycle_id, name, general_objective, level,
      duration_weeks, status, start_date, end_date, created_at,
      creator:profiles!created_by(id, full_name),
      assignments:mesocycle_assignments(
        id, mesocycle_id, player_id, group_id, assigned_at,
        player:profiles!player_id(id, full_name),
        group:training_groups!group_id(id, name)
      )
    `)
    .order('created_at', { ascending: false })

  if (role !== 'admin') {
    query = query.eq('created_by', userId)
  }

  const { data, error } = await query
  if (error) {
    console.error('[getMesocycles]', error)
    return []
  }

  return ((data ?? []) as any[]).map(normalizeMesocycle)
}

/** Detalle completo de un mesociclo con todos sus niveles. */
export async function getMesocycleById(id: string): Promise<Mesocycle | null> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  const { data, error } = await supabase
    .from('mesocycles')
    .select(`
      id, created_by, macrocycle_id, name, general_objective, level,
      duration_weeks, status, start_date, end_date, created_at,
      creator:profiles!created_by(id, full_name),
      assignments:mesocycle_assignments(
        id, mesocycle_id, player_id, group_id, assigned_at,
        player:profiles!player_id(id, full_name),
        group:training_groups!group_id(id, name)
      ),
      microcycles(
        id, mesocycle_id, week_number, weekly_objective,
        sessions:training_sessions(
          id, microcycle_id, scheduled_at, duration_min, status, coach_notes,
          blocks:session_blocks(
            id, session_id, block_type, order, duration_min, notes,
            exercises:session_block_exercises(
              id, order, repetitions, notes,
              exercise:exercises!exercise_id(
                id, name, theme, estimated_duration_min, objective
              )
            )
          )
        )
      )
    `)
    .eq('id', id)
    .order('week_number', { referencedTable: 'microcycles', ascending: true })
    .single()

  if (error || !data) return null

  const m = data as any
  if (role !== 'admin' && m.created_by !== userId) return null

  return normalizeMesocycle(m)
}

/** Mesociclos asignados al jugador autenticado. */
export async function getMyMesocycles(): Promise<Mesocycle[]> {
  const { supabase, userId } = await requireAuthShared()

  const { data: assignments } = await supabase
    .from('mesocycle_assignments')
    .select('mesocycle_id')
    .eq('player_id', userId)

  const ids = ((assignments ?? []) as { mesocycle_id: string }[]).map((a) => a.mesocycle_id)
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('mesocycles')
    .select(`
      id, created_by, macrocycle_id, name, general_objective, level,
      duration_weeks, status, start_date, end_date, created_at,
      creator:profiles!created_by(id, full_name),
      assignments:mesocycle_assignments(
        id, mesocycle_id, player_id, group_id, assigned_at,
        player:profiles!player_id(id, full_name),
        group:training_groups!group_id(id, name)
      ),
      microcycles(
        id, mesocycle_id, week_number, weekly_objective,
        sessions:training_sessions(
          id, microcycle_id, scheduled_at, duration_min, status, coach_notes,
          blocks:session_blocks(
            id, session_id, block_type, order, duration_min, notes,
            exercises:session_block_exercises(
              id, order, repetitions, notes,
              exercise:exercises!exercise_id(
                id, name, theme, estimated_duration_min, objective
              )
            )
          )
        )
      )
    `)
    .in('id', ids)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getMyMesocycles]', error)
    return []
  }

  return ((data ?? []) as any[]).map(normalizeMesocycle)
}

/** Mesociclos asignados a un jugador específico. */
export async function getMesocyclesByPlayer(playerId: string): Promise<Mesocycle[]> {
  const { supabase } = await requireCoachOrAdmin()

  const { data: assignments } = await supabase
    .from('mesocycle_assignments')
    .select('mesocycle_id')
    .eq('player_id', playerId)

  const ids = ((assignments ?? []) as { mesocycle_id: string }[]).map((a) => a.mesocycle_id)
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('mesocycles')
    .select(`
      id, created_by, macrocycle_id, name, general_objective, level,
      duration_weeks, status, start_date, end_date, created_at,
      creator:profiles!created_by(id, full_name),
      assignments:mesocycle_assignments(
        id, mesocycle_id, player_id, group_id, assigned_at,
        player:profiles!player_id(id, full_name),
        group:training_groups!group_id(id, name)
      ),
      microcycles(
        id, mesocycle_id, week_number, weekly_objective,
        sessions:training_sessions(
          id, microcycle_id, scheduled_at, duration_min, status, coach_notes,
          blocks:session_blocks(
            id, session_id, block_type, order, duration_min, notes,
            exercises:session_block_exercises(
              id, order, repetitions, notes,
              exercise:exercises!exercise_id(
                id, name, theme, estimated_duration_min, objective
              )
            )
          )
        )
      )
    `)
    .in('id', ids)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getMesocyclesByPlayer]', error)
    return []
  }

  return ((data ?? []) as any[]).map(normalizeMesocycle)
}

/** Mesociclos asignados a un grupo específico. */
export async function getMesocyclesByGroup(groupId: string): Promise<Mesocycle[]> {
  const { supabase } = await requireCoachOrAdmin()

  const { data: assignments } = await supabase
    .from('mesocycle_assignments')
    .select('mesocycle_id')
    .eq('group_id', groupId)

  const ids = ((assignments ?? []) as { mesocycle_id: string }[]).map((a) => a.mesocycle_id)
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('mesocycles')
    .select(`
      id, created_by, macrocycle_id, name, general_objective, level,
      duration_weeks, status, start_date, end_date, created_at,
      creator:profiles!created_by(id, full_name),
      assignments:mesocycle_assignments(
        id, mesocycle_id, player_id, group_id, assigned_at,
        player:profiles!player_id(id, full_name),
        group:training_groups!group_id(id, name)
      ),
      microcycles(
        id, mesocycle_id, week_number, weekly_objective,
        sessions:training_sessions(
          id, microcycle_id, scheduled_at, duration_min, status, coach_notes,
          blocks:session_blocks(
            id, session_id, block_type, order, duration_min, notes,
            exercises:session_block_exercises(
              id, order, repetitions, notes,
              exercise:exercises!exercise_id(
                id, name, theme, estimated_duration_min, objective
              )
            )
          )
        )
      )
    `)
    .in('id', ids)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getMesocyclesByGroup]', error)
    return []
  }

  return ((data ?? []) as any[]).map(normalizeMesocycle)
}

/** Jugadores y grupos disponibles para asignar un mesociclo. */
export async function getAssignmentTargets(): Promise<{
  players: { id: string; full_name: string; email: string }[]
  groups:  { id: string; name: string; level: string }[]
}> {
  const { supabase } = await requireCoachOrAdmin()

  const [{ data: players }, { data: groups }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'player')
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('training_groups')
      .select('id, name, level')
      .eq('status', 'active')
      .order('name'),
  ])

  return {
    players: (players ?? []) as { id: string; full_name: string; email: string }[],
    groups:  (groups  ?? []) as { id: string; name: string; level: string }[],
  }
}

/** Reservas confirmadas para los jugadores/grupos asignados a un mesociclo. */
export async function getConfirmedBookingsForAssignment(
  playerIds: string[],
  groupIds: string[],
): Promise<ConfirmedBooking[]> {
  const { supabase } = await requireCoachOrAdmin()

  if (playerIds.length === 0 && groupIds.length === 0) return []

  const conditions: string[] = []
  if (playerIds.length > 0) conditions.push(`player_id.in.(${playerIds.join(',')})`)
  if (groupIds.length > 0) conditions.push(`group_id.in.(${groupIds.join(',')})`)

  const { data, error } = await supabase
    .from('bookings')
    .select('id, start_time, end_time, court:courts!court_id(name)')
    .eq('status', 'confirmed')
    .or(conditions.join(','))
    .order('start_time', { ascending: true })

  if (error) {
    console.error('[getConfirmedBookingsForAssignment]', error)
    return []
  }

  return ((data ?? []) as any[]).map((b) => ({
    id:         b.id,
    start_time: b.start_time,
    end_time:   b.end_time,
    court_name: (b.court as { name: string } | null)?.name ?? null,
  }))
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeMesocycle(m: any): Mesocycle {
  return {
    ...m,
    microcycles: ((m.microcycles ?? []) as any[])
      .sort((a: any, b: any) => a.week_number - b.week_number)
      .map((mc: any) => ({
        ...mc,
        sessions: ((mc.sessions ?? []) as any[])
          .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
          .map((s: any) => ({
            ...s,
            blocks: ((s.blocks ?? []) as any[])
              .sort((a: any, b: any) => a.order - b.order)
              .map((b: any) => ({
                ...b,
                exercises: ((b.exercises ?? []) as any[])
                  .sort((a: any, b: any) => a.order - b.order),
              })),
          })),
      })),
    assignments: (m.assignments ?? []) as MesocycleAssignment[],
  }
}

// ─── Validation schemas ───────────────────────────────────────────────────────

const STATUSES = ['draft', 'active', 'completed', 'archived'] as const

const MesocycleSchema = z.object({
  name:             z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  generalObjective: z.string().min(5, 'El objetivo debe tener al menos 5 caracteres'),
  level:            z.enum(PADEL_LEVELS, { error: 'Nivel inválido' }),
  durationWeeks:    z.coerce.number().int().min(1).max(52),
  startDate:        z.string().optional(),
  status:           z.enum(STATUSES).optional(),
})

const MicrocycleSchema = z.object({
  mesocycleId:     z.string().uuid('ID de mesociclo inválido'),
  weekNumber:      z.coerce.number().int().min(1),
  weeklyObjective: z.string().optional(),
})

const SessionSchema = z.object({
  microcycleId: z.string().uuid('ID de microciclo inválido'),
  scheduledAt:  z.string().min(1, 'La fecha/hora es requerida'),
  durationMin:  z.coerce.number().int().min(15).max(240).optional(),
  coachNotes:   z.string().optional(),
})

const MacrocycleSchema = z.object({
  name:             z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  generalObjective: z.string().optional(),
  startDate:        z.string().optional(),
  endDate:          z.string().optional(),
  status:           z.enum(STATUSES).optional(),
})

// ─── Mesociclo actions ────────────────────────────────────────────────────────

/** Crear mesociclo + microciclos automáticos + asignación opcional. */
export async function createMesocycleAction(
  _prev: TrainingState,
  formData: FormData,
): Promise<TrainingState> {
  const { supabase, userId, organizationId } = await requireCoachOrAdmin()

  const parsed = MesocycleSchema.safeParse({
    name:             formData.get('name'),
    generalObjective: formData.get('generalObjective'),
    level:            formData.get('level'),
    durationWeeks:    formData.get('durationWeeks'),
    startDate:        formData.get('startDate') || undefined,
    status:           formData.get('status') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, generalObjective, level, durationWeeks, startDate } = parsed.data

  // Optional auto-assignment targets
  const playerId = (formData.get('playerId') as string)?.trim() || null
  const groupId  = (formData.get('groupId')  as string)?.trim() || null

  const startDateParsed = startDate ? new Date(startDate) : null
  const endDateParsed   = startDateParsed
    ? new Date(startDateParsed.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000)
    : null

  const { data: meso, error: mesoErr } = await supabase
    .from('mesocycles')
    .insert({
      organization_id:   organizationId,
      created_by:        userId,
      name,
      general_objective: generalObjective,
      level,
      duration_weeks:    durationWeeks,
      start_date:        startDateParsed?.toISOString().split('T')[0] ?? null,
      end_date:          endDateParsed?.toISOString().split('T')[0]   ?? null,
      status:            'draft',
    })
    .select('id')
    .single()

  if (mesoErr || !meso) {
    console.error('[createMesocycleAction]', mesoErr)
    return { error: mesoErr?.message ?? 'Error al crear el mesociclo.' }
  }

  const mesocycleId = (meso as { id: string }).id

  // Crear microciclos automáticamente (1 por semana)
  const microcycles = Array.from({ length: durationWeeks }, (_, i) => ({
    mesocycle_id: mesocycleId,
    week_number:  i + 1,
  }))

  const { error: mcErr } = await supabase.from('microcycles').insert(microcycles)
  if (mcErr) {
    console.error('[createMesocycleAction] microcycles:', mcErr)
  }

  // Auto-asignar si se especificó jugador o grupo
  if (playerId || groupId) {
    const { error: assignErr } = await supabase
      .from('mesocycle_assignments')
      .insert({ mesocycle_id: mesocycleId, player_id: playerId, group_id: groupId, assigned_by: userId })
    if (assignErr) {
      console.error('[createMesocycleAction] assignment:', assignErr)
    }
  }

  revalidatePath('/admin/planning')
  revalidatePath('/coach/planning')
  if (playerId) {
    revalidatePath(`/admin/planning/player/${playerId}`)
    revalidatePath(`/coach/planning/player/${playerId}`)
  }
  if (groupId) {
    revalidatePath(`/admin/planning/group/${groupId}`)
    revalidatePath(`/coach/planning/group/${groupId}`)
  }
  return { error: null, success: `Mesociclo "${name}" creado.`, id: mesocycleId }
}

/** Actualizar campos del mesociclo. */
export async function updateMesocycleAction(
  _prev: TrainingState,
  formData: FormData,
): Promise<TrainingState> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  const mesocycleId = (formData.get('mesocycleId') as string)?.trim()
  if (!mesocycleId) return { error: 'ID de mesociclo requerido' }

  const { data: existing } = await supabase
    .from('mesocycles')
    .select('id, created_by')
    .eq('id', mesocycleId)
    .single()

  const ex = existing as { id: string; created_by: string } | null
  if (!ex) return { error: 'Mesociclo no encontrado' }
  if (role !== 'admin' && ex.created_by !== userId) return { error: 'Sin permisos' }

  const parsed = MesocycleSchema.safeParse({
    name:             formData.get('name'),
    generalObjective: formData.get('generalObjective'),
    level:            formData.get('level'),
    durationWeeks:    formData.get('durationWeeks'),
    startDate:        formData.get('startDate') || undefined,
    status:           formData.get('status') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, generalObjective, level, durationWeeks, startDate, status } = parsed.data

  const startDateParsed = startDate ? new Date(startDate) : null
  const endDateParsed   = startDateParsed
    ? new Date(startDateParsed.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000)
    : null

  const { error } = await supabase
    .from('mesocycles')
    .update({
      name,
      general_objective: generalObjective,
      level,
      duration_weeks:    durationWeeks,
      start_date:        startDateParsed?.toISOString().split('T')[0] ?? null,
      end_date:          endDateParsed?.toISOString().split('T')[0]   ?? null,
      ...(status ? { status } : {}),
    })
    .eq('id', mesocycleId)

  if (error) return { error: error.message }

  await notifyMesocyclePlayers(mesocycleId, 'Plan actualizado', `Tu plan de entrenamiento "${name}" ha sido actualizado.`)

  revalidatePath('/admin/planning')
  revalidatePath('/coach/planning')
  revalidatePath(`/admin/planning/${mesocycleId}`)
  revalidatePath(`/coach/planning/${mesocycleId}`)
  return { error: null, success: 'Mesociclo actualizado.' }
}

/** Cambiar estado del mesociclo (draft → active → completed → archived). */
export async function updateMesocycleStatusAction(
  _prev: TrainingState,
  formData: FormData,
): Promise<TrainingState> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  const mesocycleId = (formData.get('mesocycleId') as string)?.trim()
  const newStatus   = (formData.get('status') as string)?.trim()

  if (!mesocycleId || !newStatus) return { error: 'Datos incompletos' }
  if (!(STATUSES as readonly string[]).includes(newStatus)) return { error: 'Estado inválido' }

  const { data: existing } = await supabase
    .from('mesocycles')
    .select('id, created_by')
    .eq('id', mesocycleId)
    .single()

  const ex = existing as { id: string; created_by: string } | null
  if (!ex) return { error: 'Mesociclo no encontrado' }
  if (role !== 'admin' && ex.created_by !== userId) return { error: 'Sin permisos' }

  const { error } = await supabase
    .from('mesocycles')
    .update({ status: newStatus })
    .eq('id', mesocycleId)

  if (error) return { error: error.message }

  revalidatePath('/admin/planning')
  revalidatePath('/coach/planning')
  revalidatePath(`/admin/planning/${mesocycleId}`)
  revalidatePath(`/coach/planning/${mesocycleId}`)
  return { error: null, success: 'Estado actualizado.' }
}

// ─── Asignación ───────────────────────────────────────────────────────────────

/** Asignar mesociclo a un jugador o grupo. */
export async function assignMesocycleAction(
  _prev: TrainingState,
  formData: FormData,
): Promise<TrainingState> {
  const { supabase, userId } = await requireCoachOrAdmin()

  const mesocycleId = (formData.get('mesocycleId') as string)?.trim()
  const playerId    = (formData.get('playerId') as string)?.trim() || null
  const groupId     = (formData.get('groupId') as string)?.trim() || null

  if (!mesocycleId) return { error: 'ID de mesociclo requerido' }
  if (!playerId && !groupId) return { error: 'Debes seleccionar un jugador o grupo' }
  if (playerId && groupId)   return { error: 'Selecciona solo un jugador o un grupo, no ambos' }

  // Fetch mesocycle name for the notification message
  const { data: meso } = await supabase
    .from('mesocycles')
    .select('name')
    .eq('id', mesocycleId)
    .single()
  const mesoName = (meso as { name: string } | null)?.name ?? 'un plan de entrenamiento'

  const { error } = await supabase
    .from('mesocycle_assignments')
    .insert({ mesocycle_id: mesocycleId, player_id: playerId, group_id: groupId, assigned_by: userId })

  if (error) {
    if (error.code === '23505') return { error: 'Este mesociclo ya está asignado a ese jugador/grupo' }
    return { error: error.message }
  }

  // Notify individual player or all active group members
  if (playerId) {
    await createNotification(
      playerId,
      'Nueva planificación asignada',
      `Se te asignó "${mesoName}". Revisa tu plan de entrenamiento.`,
      'session_assigned',
      '/player/my-trainings',
    )
  } else if (groupId) {
    const { data: members } = await supabase
      .from('group_members')
      .select('player_id')
      .eq('group_id', groupId)
      .eq('status', 'active')

    await Promise.all(
      ((members ?? []) as { player_id: string }[]).map((m) =>
        createNotification(
          m.player_id,
          'Nueva planificación asignada',
          `Se asignó "${mesoName}" a tu grupo. Revisa tu plan de entrenamiento.`,
          'session_assigned',
          '/player/my-trainings',
        )
      )
    )
  }

  revalidatePath(`/admin/planning/${mesocycleId}`)
  revalidatePath(`/coach/planning/${mesocycleId}`)
  return { error: null, success: 'Mesociclo asignado correctamente.' }
}

/** Quitar asignación de un mesociclo. */
export async function removeAssignmentAction(
  _prev: TrainingState,
  formData: FormData,
): Promise<TrainingState> {
  const { supabase } = await requireCoachOrAdmin()

  const assignmentId = (formData.get('assignmentId') as string)?.trim()
  if (!assignmentId) return { error: 'ID de asignación requerido' }

  const { error } = await supabase
    .from('mesocycle_assignments')
    .delete()
    .eq('id', assignmentId)

  if (error) return { error: error.message }

  revalidatePath('/admin/planning')
  revalidatePath('/coach/planning')
  return { error: null, success: 'Asignación eliminada.' }
}

// ─── Microciclo actions ───────────────────────────────────────────────────────

/** Actualizar objetivo semanal de un microciclo. */
export async function updateMicrocycleAction(
  _prev: TrainingState,
  formData: FormData,
): Promise<TrainingState> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  const microcycleId   = (formData.get('microcycleId') as string)?.trim()
  const weeklyObjective = (formData.get('weeklyObjective') as string)?.trim() || null

  if (!microcycleId) return { error: 'ID de microciclo requerido' }

  const denied = await assertMesocycleOwner(supabase, role, userId, 'microcycle', microcycleId)
  if (denied) return denied

  const { error } = await supabase
    .from('microcycles')
    .update({ weekly_objective: weeklyObjective })
    .eq('id', microcycleId)

  if (error) return { error: error.message }

  revalidatePath('/admin/planning')
  revalidatePath('/coach/planning')
  return { error: null, success: 'Objetivo semanal actualizado.' }
}

// ─── Sesión actions ───────────────────────────────────────────────────────────

const BLOCK_DEFAULTS: { block_type: string; order: number; duration_min: number }[] = [
  { block_type: 'calentamiento',    order: 1, duration_min: 10 },
  { block_type: 'central',          order: 2, duration_min: 35 },
  { block_type: 'vuelta_a_la_calma', order: 3, duration_min: 15 },
]

/** Crear sesión con sus 4 bloques fijos. */
export async function createSessionAction(
  _prev: TrainingState,
  formData: FormData,
): Promise<TrainingState> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  const parsed = SessionSchema.safeParse({
    microcycleId: formData.get('microcycleId'),
    scheduledAt:  formData.get('scheduledAt'),
    durationMin:  formData.get('durationMin') || undefined,
    coachNotes:   formData.get('coachNotes')  || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { microcycleId, scheduledAt, durationMin, coachNotes } = parsed.data

  const denied = await assertMesocycleOwner(supabase, role, userId, 'microcycle', microcycleId)
  if (denied) return denied

  const { data: session, error: sessionErr } = await supabase
    .from('training_sessions')
    .insert({
      microcycle_id: microcycleId,
      scheduled_at:  colombiaLocalToISO(scheduledAt),
      duration_min:  durationMin ?? 90,
      coach_notes:   coachNotes ?? null,
      status:        'scheduled',
    })
    .select('id')
    .single()

  if (sessionErr || !session) {
    console.error('[createSessionAction]', sessionErr)
    return { error: sessionErr?.message ?? 'Error al crear la sesión.' }
  }

  const sessionId = (session as { id: string }).id

  // Crear los 4 bloques automáticamente
  const { error: blocksErr } = await supabase
    .from('session_blocks')
    .insert(BLOCK_DEFAULTS.map((b) => ({ ...b, session_id: sessionId })))

  if (blocksErr) {
    console.error('[createSessionAction] blocks:', blocksErr)
  }

  const { data: mc } = await supabase
    .from('microcycles')
    .select('mesocycle_id')
    .eq('id', microcycleId)
    .single()

  if (mc) {
    const dateLabel = new Date(colombiaLocalToISO(scheduledAt)).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'America/Bogota' })
    await notifyMesocyclePlayers((mc as { mesocycle_id: string }).mesocycle_id, 'Nueva sesión programada', `Se ha programado una nueva sesión: ${dateLabel}.`)
  }

  revalidatePath('/admin/planning')
  revalidatePath('/coach/planning')
  return { error: null, success: 'Sesión creada con 3 bloques.', id: sessionId }
}

/** Actualizar datos de una sesión. */
export async function updateSessionAction(
  _prev: TrainingState,
  formData: FormData,
): Promise<TrainingState> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  const sessionId  = (formData.get('sessionId') as string)?.trim()
  const scheduledAt = (formData.get('scheduledAt') as string)?.trim()
  const durationMin = formData.get('durationMin')
  const coachNotes  = (formData.get('coachNotes') as string)?.trim() || null

  if (!sessionId) return { error: 'ID de sesión requerido' }

  const denied = await assertMesocycleOwner(supabase, role, userId, 'session', sessionId)
  if (denied) return denied

  const updates: Record<string, unknown> = { coach_notes: coachNotes }
  if (scheduledAt) updates.scheduled_at = colombiaLocalToISO(scheduledAt)
  if (durationMin)  updates.duration_min = Number(durationMin)

  const { error } = await supabase
    .from('training_sessions')
    .update(updates)
    .eq('id', sessionId)

  if (error) return { error: error.message }

  const { data: sessData } = await supabase
    .from('training_sessions')
    .select('microcycle:microcycles!microcycle_id(mesocycle_id)')
    .eq('id', sessionId)
    .single()
  const mesocycleIdForNotif = (sessData as { microcycle: { mesocycle_id: string } | null } | null)?.microcycle?.mesocycle_id
  if (mesocycleIdForNotif) {
    await notifyMesocyclePlayers(mesocycleIdForNotif, 'Sesión modificada', 'Una sesión de tu plan de entrenamiento ha sido modificada.')
  }

  revalidatePath('/admin/planning')
  revalidatePath('/coach/planning')
  return { error: null, success: 'Sesión actualizada.' }
}

/** Marcar sesión como completada / cancelada / programada. */
export async function updateSessionStatusAction(
  _prev: TrainingState,
  formData: FormData,
): Promise<TrainingState> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  const sessionId = (formData.get('sessionId') as string)?.trim()
  const status    = (formData.get('status') as string)?.trim()

  if (!sessionId || !status) return { error: 'Datos incompletos' }
  if (!['scheduled', 'completed', 'cancelled'].includes(status)) return { error: 'Estado inválido' }

  const denied = await assertMesocycleOwner(supabase, role, userId, 'session', sessionId)
  if (denied) return denied

  const { error } = await supabase
    .from('training_sessions')
    .update({ status })
    .eq('id', sessionId)

  if (error) return { error: error.message }

  if (status === 'completed') {
    const { data: sessData } = await supabase
      .from('training_sessions')
      .select('microcycle:microcycles!microcycle_id(mesocycle_id)')
      .eq('id', sessionId)
      .single()
    const mesocycleIdForNotif = (sessData as { microcycle: { mesocycle_id: string } | null } | null)?.microcycle?.mesocycle_id
    if (mesocycleIdForNotif) {
      await notifyMesocyclePlayers(mesocycleIdForNotif, 'Sesión completada ✓', 'Una sesión de tu plan de entrenamiento ha sido completada.')
    }
  }

  revalidatePath('/admin/planning')
  revalidatePath('/coach/planning')
  return { error: null, success: 'Estado de sesión actualizado.' }
}

// ─── Bloques — ejercicios ─────────────────────────────────────────────────────

/** Agregar un ejercicio de la biblioteca a un bloque. */
export async function addExerciseToBlockAction(
  _prev: TrainingState,
  formData: FormData,
): Promise<TrainingState> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  const blockId     = (formData.get('blockId') as string)?.trim()
  const exerciseId  = (formData.get('exerciseId') as string)?.trim()
  const repetitions = (formData.get('repetitions') as string)?.trim() || null
  const notes       = (formData.get('notes') as string)?.trim() || null

  if (!blockId || !exerciseId) return { error: 'blockId y exerciseId son requeridos' }

  const denied = await assertMesocycleOwner(supabase, role, userId, 'block', blockId)
  if (denied) return denied

  // Calcular el siguiente orden
  const { data: existing } = await supabase
    .from('session_block_exercises')
    .select('order')
    .eq('block_id', blockId)
    .order('order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = ((existing as { order: number } | null)?.order ?? 0) + 1

  const { error } = await supabase
    .from('session_block_exercises')
    .insert({ block_id: blockId, exercise_id: exerciseId, order: nextOrder, repetitions, notes })

  if (error) {
    if (error.code === '23505') return { error: 'Este ejercicio ya está en el bloque' }
    return { error: error.message }
  }

  revalidatePath('/admin/planning')
  revalidatePath('/coach/planning')
  return { error: null, success: 'Ejercicio agregado al bloque.' }
}

/** Quitar un ejercicio de un bloque. */
export async function removeExerciseFromBlockAction(
  _prev: TrainingState,
  formData: FormData,
): Promise<TrainingState> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  const blockExerciseId = (formData.get('blockExerciseId') as string)?.trim()
  if (!blockExerciseId) return { error: 'ID requerido' }

  const denied = await assertMesocycleOwner(supabase, role, userId, 'blockExercise', blockExerciseId)
  if (denied) return denied

  const { error } = await supabase
    .from('session_block_exercises')
    .delete()
    .eq('id', blockExerciseId)

  if (error) return { error: error.message }

  revalidatePath('/admin/planning')
  revalidatePath('/coach/planning')
  return { error: null, success: 'Ejercicio quitado del bloque.' }
}

/** Actualizar notas de un bloque. */
export async function updateBlockNotesAction(
  _prev: TrainingState,
  formData: FormData,
): Promise<TrainingState> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  const blockId = (formData.get('blockId') as string)?.trim()
  const notes   = (formData.get('notes') as string)?.trim() || null

  if (!blockId) return { error: 'ID de bloque requerido' }

  const denied = await assertMesocycleOwner(supabase, role, userId, 'block', blockId)
  if (denied) return denied

  const { error } = await supabase
    .from('session_blocks')
    .update({ notes })
    .eq('id', blockId)

  if (error) return { error: error.message }

  revalidatePath('/admin/planning')
  revalidatePath('/coach/planning')
  return { error: null, success: 'Notas actualizadas.' }
}

// ─── Direct-submit wrappers (for <form action> in Server Components) ──────────
// useActionState actions return TrainingState which TS rejects as form action.
// These thin wrappers discard the return value so the type is void.

export async function changeMesocycleStatusAction(formData: FormData): Promise<void> {
  await updateMesocycleStatusAction({ error: null }, formData)
}

export async function changeSessionStatusAction(formData: FormData): Promise<void> {
  await updateSessionStatusAction({ error: null }, formData)
}

// ─── Asistencia ───────────────────────────────────────────────────────────────

/** Registrar asistencia de uno o varios jugadores a una sesión. */
export async function recordAttendanceAction(
  _prev: TrainingState,
  formData: FormData,
): Promise<TrainingState> {
  const { supabase } = await requireCoachOrAdmin()

  const sessionId    = (formData.get('sessionId') as string)?.trim()
  const attendanceJson = (formData.get('attendanceJson') as string)?.trim()

  if (!sessionId || !attendanceJson) return { error: 'Datos incompletos' }

  let records: { playerId: string; status: string; notes?: string }[]
  try {
    records = JSON.parse(attendanceJson)
  } catch {
    return { error: 'Formato de asistencia inválido' }
  }

  const VALID_STATUSES = ['present', 'absent', 'justified']
  const rows = records
    .filter((r) => r.playerId && VALID_STATUSES.includes(r.status))
    .map((r) => ({
      session_id: sessionId,
      player_id:  r.playerId,
      status:     r.status,
      notes:      r.notes ?? null,
    }))

  if (rows.length === 0) return { error: 'Sin registros válidos de asistencia' }

  const { error } = await supabase
    .from('session_attendance')
    .upsert(rows, { onConflict: 'session_id,player_id' })

  if (error) return { error: error.message }

  revalidatePath('/admin/planning')
  revalidatePath('/coach/planning')
  return { error: null, success: `Asistencia registrada para ${rows.length} jugadores.` }
}

// ─── Coach Trainings view ─────────────────────────────────────────────────────

export type CoachSession = {
  id:              string
  scheduledAt:     string   // ISO
  durationMin:     number
  status:          'scheduled' | 'completed' | 'cancelled'
  coachNotes:      string | null
  attendanceCount: number
  mesocycleId:     string
  mesocycleName:   string
  weekNumber:      number
}

/** Todas las sesiones de los mesociclos creados por el coach autenticado. */
export async function getCoachSessions(): Promise<CoachSession[]> {
  const { supabase, userId } = await requireCoachOrAdmin()

  const { data: mesos } = await supabase
    .from('mesocycles')
    .select('id, name')
    .eq('created_by', userId)

  if (!mesos || mesos.length === 0) return []

  const mesoIds  = (mesos as { id: string; name: string }[]).map((m) => m.id)
  const mesoName = new Map((mesos as { id: string; name: string }[]).map((m) => [m.id, m.name]))

  const { data: micros } = await supabase
    .from('microcycles')
    .select('id, mesocycle_id, week_number')
    .in('mesocycle_id', mesoIds)

  if (!micros || micros.length === 0) return []

  const microIds = (micros as any[]).map((m) => m.id)
  const microMap = new Map((micros as any[]).map((m) => [m.id, m]))

  const { data: sessions } = await supabase
    .from('training_sessions')
    .select('id, microcycle_id, scheduled_at, duration_min, status, coach_notes')
    .in('microcycle_id', microIds)
    .order('scheduled_at', { ascending: false })

  if (!sessions || sessions.length === 0) return []

  const sessionIds = (sessions as any[]).map((s) => s.id)

  const { data: attRows } = await supabase
    .from('session_attendance')
    .select('session_id')
    .in('session_id', sessionIds)

  const countMap = new Map<string, number>()
  for (const a of (attRows ?? []) as { session_id: string }[]) {
    countMap.set(a.session_id, (countMap.get(a.session_id) ?? 0) + 1)
  }

  return (sessions as any[]).map((s) => {
    const micro = microMap.get(s.microcycle_id)
    return {
      id:              s.id as string,
      scheduledAt:     s.scheduled_at as string,
      durationMin:     s.duration_min as number,
      status:          s.status as CoachSession['status'],
      coachNotes:      s.coach_notes as string | null,
      attendanceCount: countMap.get(s.id) ?? 0,
      mesocycleId:     micro?.mesocycle_id ?? '',
      mesocycleName:   mesoName.get(micro?.mesocycle_id) ?? '',
      weekNumber:      micro?.week_number ?? 0,
    }
  })
}

/** Jugadores asignados al mesociclo de una sesión + asistencia ya registrada. */
export async function getSessionPlayers(sessionId: string): Promise<{
  players: { id: string; fullName: string; avatarUrl: string | null }[]
  attendance: Record<string, { status: string; notes: string | null }>
}> {
  const { supabase } = await requireCoachOrAdmin()

  // Existing attendance records for this session
  const { data: attendanceData } = await supabase
    .from('session_attendance')
    .select('player_id, status, notes')
    .eq('session_id', sessionId)

  const attendance: Record<string, { status: string; notes: string | null }> = {}
  for (const a of (attendanceData ?? []) as { player_id: string; status: string; notes: string | null }[]) {
    attendance[a.player_id] = { status: a.status, notes: a.notes }
  }

  // Trace session → microcycle → mesocycle
  const { data: sessionRow } = await supabase
    .from('training_sessions')
    .select('microcycle_id')
    .eq('id', sessionId)
    .single()

  if (!sessionRow) return { players: [], attendance }

  const { data: microcycleRow } = await supabase
    .from('microcycles')
    .select('mesocycle_id')
    .eq('id', (sessionRow as { microcycle_id: string }).microcycle_id)
    .single()

  if (!microcycleRow) return { players: [], attendance }

  // Assignments for the mesocycle
  const { data: assignments } = await supabase
    .from('mesocycle_assignments')
    .select('player_id, group_id')
    .eq('mesocycle_id', (microcycleRow as { mesocycle_id: string }).mesocycle_id)

  const playerIds = new Set<string>()
  const groupIds: string[] = []

  for (const a of (assignments ?? []) as { player_id: string | null; group_id: string | null }[]) {
    if (a.player_id) playerIds.add(a.player_id)
    if (a.group_id)  groupIds.push(a.group_id)
  }

  // Expand group assignments to individual members
  if (groupIds.length > 0) {
    const { data: members } = await supabase
      .from('group_members')
      .select('player_id')
      .in('group_id', groupIds)
      .eq('status', 'active')

    for (const m of (members ?? []) as { player_id: string }[]) {
      playerIds.add(m.player_id)
    }
  }

  if (playerIds.size === 0) return { players: [], attendance }

  // Fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', Array.from(playerIds))
    .order('full_name', { ascending: true })

  const players = ((profiles ?? []) as any[]).map((p) => ({
    id:        p.id as string,
    fullName:  p.full_name as string,
    avatarUrl: (p.avatar_url as string | null) ?? null,
  }))

  return { players, attendance }
}

// ─── Macrociclo actions ───────────────────────────────────────────────────────

/** Lista de macrociclos. Admin ve todos; coach solo los suyos. */
export async function getMacrocycles(): Promise<Macrocycle[]> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  let query = supabase
    .from('macrocycles')
    .select('id, created_by, name, general_objective, status, start_date, end_date, created_at, creator:profiles!created_by(id, full_name), mesocycles(id)')
    .order('created_at', { ascending: false })

  if (role !== 'admin') query = query.eq('created_by', userId)

  const { data } = await query

  return ((data ?? []) as any[]).map((m) => ({
    id:                m.id,
    created_by:        m.created_by,
    name:              m.name,
    general_objective: m.general_objective ?? null,
    status:            m.status,
    start_date:        m.start_date,
    end_date:          m.end_date,
    created_at:        m.created_at,
    creator:           Array.isArray(m.creator) ? (m.creator[0] ?? null) : (m.creator ?? null),
    mesocycle_count:   (m.mesocycles ?? []).length,
  }))
}

/** Detalle de un macrociclo con sus mesociclos. */
export async function getMacrocycleById(id: string): Promise<Macrocycle | null> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  const { data } = await supabase
    .from('macrocycles')
    .select('id, created_by, name, general_objective, status, start_date, end_date, created_at, creator:profiles!created_by(id, full_name), mesocycles(id, name, level, status, duration_weeks, start_date, end_date)')
    .eq('id', id)
    .single()

  const m = data as any
  if (!m) return null
  if (role !== 'admin' && m.created_by !== userId) return null

  return {
    id:                m.id,
    created_by:        m.created_by,
    name:              m.name,
    general_objective: m.general_objective ?? null,
    status:            m.status,
    start_date:        m.start_date,
    end_date:          m.end_date,
    created_at:        m.created_at,
    creator:           Array.isArray(m.creator) ? (m.creator[0] ?? null) : (m.creator ?? null),
    mesocycles:        ((m.mesocycles ?? []) as any[])
      .sort((a: any, b: any) => (a.start_date ?? '').localeCompare(b.start_date ?? '')),
  }
}

/** Crear un macrociclo. */
export async function createMacrocycleAction(
  _prev: TrainingState,
  formData: FormData,
): Promise<TrainingState> {
  const { supabase, userId, organizationId } = await requireCoachOrAdmin()

  const parsed = MacrocycleSchema.safeParse({
    name:             formData.get('name'),
    generalObjective: formData.get('generalObjective') || undefined,
    startDate:        formData.get('startDate') || undefined,
    endDate:          formData.get('endDate')   || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, generalObjective, startDate, endDate } = parsed.data

  const { data: macro, error } = await supabase
    .from('macrocycles')
    .insert({
      organization_id:   organizationId,
      created_by:        userId,
      name,
      general_objective: generalObjective ?? null,
      start_date:        startDate ?? null,
      end_date:          endDate ?? null,
      status:            'draft',
    })
    .select('id')
    .single()

  if (error || !macro) {
    console.error('[createMacrocycleAction]', error)
    return { error: error?.message ?? 'Error al crear el macrociclo.' }
  }

  revalidatePath('/admin/planning')
  revalidatePath('/coach/planning')
  return { error: null, success: `Macrociclo "${name}" creado.`, id: (macro as { id: string }).id }
}

/** Actualizar campos del macrociclo. */
export async function updateMacrocycleAction(
  _prev: TrainingState,
  formData: FormData,
): Promise<TrainingState> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  const macrocycleId = (formData.get('macrocycleId') as string)?.trim()
  if (!macrocycleId) return { error: 'ID de macrociclo requerido' }

  const { data: existing } = await supabase
    .from('macrocycles')
    .select('id, created_by')
    .eq('id', macrocycleId)
    .single()

  const ex = existing as { id: string; created_by: string } | null
  if (!ex) return { error: 'Macrociclo no encontrado' }
  if (role !== 'admin' && ex.created_by !== userId) return { error: 'Sin permisos' }

  const parsed = MacrocycleSchema.safeParse({
    name:             formData.get('name'),
    generalObjective: formData.get('generalObjective') || undefined,
    startDate:        formData.get('startDate') || undefined,
    endDate:          formData.get('endDate')   || undefined,
    status:           formData.get('status')    || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, generalObjective, startDate, endDate, status } = parsed.data

  const { error } = await supabase
    .from('macrocycles')
    .update({
      name,
      general_objective: generalObjective ?? null,
      start_date:        startDate ?? null,
      end_date:          endDate ?? null,
      ...(status ? { status } : {}),
    })
    .eq('id', macrocycleId)

  if (error) return { error: error.message }

  revalidatePath('/admin/planning')
  revalidatePath('/coach/planning')
  revalidatePath(`/admin/planning/macro/${macrocycleId}`)
  revalidatePath(`/coach/planning/macro/${macrocycleId}`)
  return { error: null, success: 'Macrociclo actualizado.' }
}

/** Cambiar estado del macrociclo (draft → active → completed → archived). */
export async function updateMacrocycleStatusAction(
  _prev: TrainingState,
  formData: FormData,
): Promise<TrainingState> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  const macrocycleId = (formData.get('macrocycleId') as string)?.trim()
  const newStatus    = (formData.get('status') as string)?.trim()

  if (!macrocycleId || !newStatus) return { error: 'Datos incompletos' }
  if (!(STATUSES as readonly string[]).includes(newStatus)) return { error: 'Estado inválido' }

  const { data: existing } = await supabase
    .from('macrocycles')
    .select('id, created_by')
    .eq('id', macrocycleId)
    .single()

  const ex = existing as { id: string; created_by: string } | null
  if (!ex) return { error: 'Macrociclo no encontrado' }
  if (role !== 'admin' && ex.created_by !== userId) return { error: 'Sin permisos' }

  const { error } = await supabase
    .from('macrocycles')
    .update({ status: newStatus })
    .eq('id', macrocycleId)

  if (error) return { error: error.message }

  revalidatePath('/admin/planning')
  revalidatePath('/coach/planning')
  revalidatePath(`/admin/planning/macro/${macrocycleId}`)
  revalidatePath(`/coach/planning/macro/${macrocycleId}`)
  return { error: null, success: 'Estado del macrociclo actualizado.' }
}

/** Vincular o desvincular un mesociclo a un macrociclo. macrocycleId vacío = desvincular. */
export async function setMesocycleMacrocycleAction(formData: FormData): Promise<void> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  const mesocycleId  = (formData.get('mesocycleId') as string)?.trim()
  const macrocycleId = (formData.get('macrocycleId') as string)?.trim() || null
  if (!mesocycleId) return

  const denied = await assertMesocycleOwnerByMesocycleId(supabase, role, userId, mesocycleId)
  if (denied) return

  await supabase
    .from('mesocycles')
    .update({ macrocycle_id: macrocycleId })
    .eq('id', mesocycleId)

  revalidatePath('/admin/planning')
  revalidatePath('/coach/planning')
  if (macrocycleId) {
    revalidatePath(`/admin/planning/macro/${macrocycleId}`)
    revalidatePath(`/coach/planning/macro/${macrocycleId}`)
  }
}

/** Direct-submit wrapper para <form action> en Server Components. */
export async function changeMacrocycleStatusAction(formData: FormData): Promise<void> {
  await updateMacrocycleStatusAction({ error: null }, formData)
}

async function assertMesocycleOwnerByMesocycleId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  role: string,
  userId: string,
  mesocycleId: string,
): Promise<{ error: string } | null> {
  if (role === 'admin') return null
  const { data } = await supabase
    .from('mesocycles')
    .select('created_by')
    .eq('id', mesocycleId)
    .single()
  return (data as { created_by: string } | null)?.created_by === userId ? null : { error: 'Sin permisos' }
}
