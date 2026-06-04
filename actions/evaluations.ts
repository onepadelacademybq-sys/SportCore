'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { STROKE_GROUPS, type ShotGroup } from '@/lib/eval-strokes'
import { createNotification, notifyAdmins } from '@/actions/notifications'

// ─── Types ────────────────────────────────────────────────────────────────────

export type EvaluationStatus = 'requested' | 'scheduled' | 'payment_pending' | 'confirmed' | 'completed'

export type TechnicalShot = {
  strokeGroup: ShotGroup
  strokeName:  string
  s1: boolean; s2: boolean; s3: boolean; s4: boolean; s5: boolean
}

export type GameStats = {
  primer_srv?:  number
  segundo_srv?: number
  err_dev?:     number
  doble_falta?: number
  w_drive?:     number; e_drive?:   number
  w_reves?:     number; e_reves?:   number
  w_smash?:     number; e_smash?:   number
  w_bandeja?:   number; e_bandeja?: number
  w_volea?:     number; e_volea?:   number
}

export type TacticalGame = {
  gameNumber: number
  ptsPlayer?:  number | null
  ptsRival?:   number | null
  driveStats:  GameStats
  revesStats:  GameStats
}

export type AnthropometricData = {
  peso?:               number | null
  talla?:              number | null
  pctAdiposo?:         number | null
  pctMusculo?:         number | null
  edadBiologica?:      number | null
  grasaVisceral?:      number | null
  tricipital?:         number | null
  bicipital?:          number | null
  subescapular?:       number | null
  iliocrestal?:        number | null
  supraespinal?:       number | null
  abdominal?:          number | null
  musloPliegue?:       number | null
  pantorrillaPliegue?: number | null
  pechoMinimo?:        number | null
  cintura?:            number | null
  cadera?:             number | null
  bicepsDRel?:         number | null
  bicepsDCon?:         number | null
  bicepsIRel?:         number | null
  bicepsICon?:         number | null
  antebrazoD?:         number | null
  antebrazoI?:         number | null
  musloD?:             number | null
  musloI?:             number | null
  pantorrillaD?:       number | null
  pantorrillaI?:       number | null
}

export type PhysicalData = {
  sj1?: number | null; sj2?: number | null; sj3?: number | null
  cmj1?: number | null; cmj2?: number | null; cmj3?: number | null
  abalakov1?: number | null; abalakov2?: number | null; abalakov3?: number | null
  vel10m1?: number | null; vel10m2?: number | null; vel10m3?: number | null
  bolasLateral1?: number | null; bolasLateral2?: number | null; bolasLateral3?: number | null
  bolasFrontal1?: number | null; bolasFrontal2?: number | null; bolasFrontal3?: number | null
  desplazLatD?: number | null; desplazLatI?: number | null
  zigzag1?: number | null; zigzag2?: number | null; zigzag3?: number | null
  resistencia5k?: number | null
}

export type EvaluationSummary = {
  id:               string
  title:            string
  evaluatedAt:      string
  isShared:         boolean
  notes:            string | null
  evaluationStatus: EvaluationStatus
  scheduledDate:    string | null
  scheduledTime:    string | null
  paymentProofUrl:  string | null
  paymentAmount:    number | null
  player:           { id: string; full_name: string }
  coach:            { id: string; full_name: string } | null
}

export type ShotRow = {
  stroke_group: string
  stroke_name:  string
  s1: boolean; s2: boolean; s3: boolean; s4: boolean; s5: boolean
  hits: number
  pct:  string
}

export type EvaluationDetail = {
  id:          string
  title:       string
  notes:       string | null
  evaluatedAt: string
  isShared:    boolean
  player:      { id: string; full_name: string }
  coach:       { id: string; full_name: string }
  technicalShots:  ShotRow[]
  tacticalGames:   TacticalGameRow[]
  anthropometric:  AnthropometricData | null
  physical:        PhysicalData | null
}

export type TacticalGameRow = {
  game_number: number
  pts_player:  number | null
  pts_rival:   number | null
  drive_stats: GameStats
  reves_stats: GameStats
}

export type TrafficLight = 'verde' | 'amarillo' | 'rojo'

export type TechGroupResult = {
  group:          ShotGroup
  label:          string
  avgPct:         number
  light:          TrafficLight
  priority:       'Alta' | 'Media' | 'Baja'
  recommendation: string
  shotCount:      number
}

export type DashboardData = {
  evaluationId: string
  technical: {
    byGroup:     TechGroupResult[]
    overallPct:  number
    overallLight: TrafficLight
  } | null
  tactical: {
    games:          number
    totalWinners:   number
    totalErrors:    number
    winnersByType:  Record<string, number>
    errorsByType:   Record<string, number>
  } | null
  physical: {
    bestSJ:         number | null
    bestCMJ:        number | null
    bestAbalakov:   number | null
    bestVel10m:     number | null
    bestBolasLateral: number | null
    bestBolasFrontal: number | null
    desplazLatD:    number | null
    desplazLatI:    number | null
    bestZigzag:     number | null
    resistencia5k:  number | null
  } | null
  anthropometric: AnthropometricData | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function trafficLight(pct: number): TrafficLight {
  if (pct >= 70) return 'verde'
  if (pct >= 40) return 'amarillo'
  return 'rojo'
}

function priority(light: TrafficLight): 'Alta' | 'Media' | 'Baja' {
  if (light === 'rojo')    return 'Alta'
  if (light === 'amarillo') return 'Media'
  return 'Baja'
}

function recommendation(light: TrafficLight): string {
  if (light === 'rojo')    return 'Área crítica — trabajar con alta frecuencia'
  if (light === 'amarillo') return 'En desarrollo — continuar con práctica regular'
  return 'Nivel adecuado — mantener y consolidar'
}

function bestMax(...vals: (number | null | undefined)[]): number | null {
  const nums = vals.filter((v): v is number => v != null)
  return nums.length ? Math.max(...nums) : null
}

function bestMin(...vals: (number | null | undefined)[]): number | null {
  const nums = vals.filter((v): v is number => v != null)
  return nums.length ? Math.min(...nums) : null
}

function revalidateEval(id: string) {
  revalidatePath(`/admin/evaluations/${id}`)
  revalidatePath(`/coach/evaluations/${id}`)
  revalidatePath(`/player/my-evaluations`)
}

// ─── Nuevo flujo de evaluaciones ─────────────────────────────────────────────

export type EvaluationFlowState = { error: string | null; success?: string; id?: string }

/** Jugador o admin solicita una evaluación. Estado: requested. */
export async function requestEvaluationAction(
  _prev: EvaluationFlowState,
  formData: FormData,
): Promise<EvaluationFlowState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title    = (formData.get('title') as string)?.trim()
  const notes    = (formData.get('notes') as string)?.trim() || null
  // Admin puede especificar player_id; player usa su propio id
  const playerId = (formData.get('playerId') as string)?.trim() || user.id

  if (!title) return { error: 'El título es requerido' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('evaluations')
    .insert({
      player_id:         playerId,
      title,
      notes,
      evaluated_at:      new Date().toISOString(),
      evaluation_status: 'requested',
      payment_amount:    270000,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Error al solicitar la evaluación' }

  const evalId = (data as { id: string }).id

  await notifyAdmins(
    'Nueva evaluación solicitada',
    `Un jugador solicitó una evaluación: "${title}"`,
    'evaluation_ready',
    '/admin/evaluations',
  )

  revalidatePath('/admin/evaluations')
  revalidatePath('/player/my-evaluations')
  return { error: null, success: 'Evaluación solicitada. El administrador la agendará pronto.', id: evalId }
}

/** Admin agenda la evaluación (fecha, hora, coach, monto). Estado: scheduled. */
export async function scheduleEvaluationAction(
  _prev: EvaluationFlowState,
  formData: FormData,
): Promise<EvaluationFlowState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'admin') return { error: 'Sin permisos' }

  const evalId       = (formData.get('evalId') as string)?.trim()
  const scheduledDate = (formData.get('scheduledDate') as string)?.trim()
  const scheduledTime = (formData.get('scheduledTime') as string)?.trim()
  const coachId      = (formData.get('coachId') as string)?.trim() || null
  const amount       = Number(formData.get('paymentAmount')) || 270000

  if (!evalId || !scheduledDate || !scheduledTime) return { error: 'Fecha y hora son requeridas' }

  const admin = createAdminClient()
  const { data: ev } = await admin.from('evaluations').select('player_id, title').eq('id', evalId).single()
  const e = ev as { player_id: string; title: string } | null
  if (!e) return { error: 'Evaluación no encontrada' }

  const { error } = await admin
    .from('evaluations')
    .update({
      evaluation_status: 'scheduled',
      scheduled_date:    scheduledDate,
      scheduled_time:    scheduledTime,
      coach_id:          coachId,
      payment_amount:    amount,
    })
    .eq('id', evalId)

  if (error) return { error: error.message }

  const dateLabel = new Date(`${scheduledDate}T${scheduledTime}`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeLabel = scheduledTime.slice(0, 5)

  await createNotification(
    e.player_id,
    'Evaluación agendada',
    `Tu evaluación "${e.title}" fue agendada para el ${dateLabel} a las ${timeLabel}. Sube tu comprobante de pago para confirmar.`,
    'evaluation_ready',
    '/player/my-evaluations',
  )

  revalidatePath('/admin/evaluations')
  revalidatePath('/player/my-evaluations')
  return { error: null, success: 'Evaluación agendada correctamente.' }
}

const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_PROOF_SIZE = 5 * 1024 * 1024

/** Jugador sube comprobante de pago. Estado: payment_pending. */
export async function uploadEvaluationPaymentProofAction(
  _prev: EvaluationFlowState,
  formData: FormData,
): Promise<EvaluationFlowState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const evalId = (formData.get('evalId') as string)?.trim()
  if (!evalId) return { error: 'ID de evaluación requerido' }

  const file = formData.get('paymentProof') as File | null
  if (!file || file.size === 0) return { error: 'Selecciona un comprobante' }
  if (!ALLOWED_PROOF_TYPES.includes(file.type)) return { error: 'Solo JPG, PNG o PDF' }
  if (file.size > MAX_PROOF_SIZE) return { error: 'El archivo no puede superar 5 MB' }

  const { data: ev } = await supabase
    .from('evaluations')
    .select('player_id, title, evaluation_status')
    .eq('id', evalId)
    .single()

  const e = ev as { player_id: string; title: string; evaluation_status: string } | null
  if (!e) return { error: 'Evaluación no encontrada' }
  if (e.player_id !== user.id) return { error: 'Sin permisos' }
  if (e.evaluation_status !== 'scheduled') return { error: 'Solo se puede subir comprobante en evaluaciones agendadas' }

  const ext    = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg'
  const path   = `${evalId}/${Date.now()}.${ext}`
  const buffer = await file.arrayBuffer()
  const admin  = createAdminClient()

  const { error: uploadErr } = await admin.storage
    .from('evaluation-proofs')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadErr) return { error: 'Error al subir el archivo. Intenta nuevamente.' }

  const { error: dbErr } = await admin
    .from('evaluations')
    .update({ payment_proof_url: path, evaluation_status: 'payment_pending' })
    .eq('id', evalId)

  if (dbErr) return { error: 'Error al actualizar el estado' }

  await notifyAdmins(
    'Comprobante de evaluación subido',
    `Un jugador subió su comprobante para la evaluación "${e.title}". Pendiente de confirmación.`,
    'payment_processed',
    '/admin/evaluations',
  )

  revalidatePath('/admin/evaluations')
  revalidatePath('/player/my-evaluations')
  return { error: null, success: 'Comprobante enviado. El administrador confirmará el pago.' }
}

/** Admin confirma el pago. Estado: confirmed. Notifica a jugador, coach y admins. */
export async function confirmEvaluationPaymentAction(
  _prev: EvaluationFlowState,
  formData: FormData,
): Promise<EvaluationFlowState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'admin') return { error: 'Sin permisos' }

  const evalId = (formData.get('evalId') as string)?.trim()
  if (!evalId) return { error: 'ID de evaluación requerido' }

  const admin = createAdminClient()
  const { data: ev } = await admin
    .from('evaluations')
    .select('player_id, coach_id, title, scheduled_date, scheduled_time')
    .eq('id', evalId)
    .single()

  const e = ev as {
    player_id:      string
    coach_id:       string | null
    title:          string
    scheduled_date: string | null
    scheduled_time: string | null
  } | null
  if (!e) return { error: 'Evaluación no encontrada' }

  const { error } = await admin
    .from('evaluations')
    .update({ evaluation_status: 'confirmed' })
    .eq('id', evalId)

  if (error) return { error: error.message }

  const dateLabel = e.scheduled_date
    ? new Date(`${e.scheduled_date}T${e.scheduled_time ?? '00:00'}`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'fecha por definir'
  const timeLabel = e.scheduled_time ? e.scheduled_time.slice(0, 5) : ''
  const body = `Evaluación "${e.title}" confirmada para el ${dateLabel}${timeLabel ? ` a las ${timeLabel}` : ''}.`

  await Promise.all([
    createNotification(e.player_id, 'Evaluación confirmada', body, 'evaluation_ready', '/player/my-evaluations'),
    e.coach_id
      ? createNotification(e.coach_id, 'Evaluación confirmada', body, 'evaluation_ready', '/coach/evaluations')
      : Promise.resolve(),
  ])

  revalidatePath('/admin/evaluations')
  revalidatePath('/player/my-evaluations')
  revalidatePath('/coach/evaluations')
  return { error: null, success: 'Pago confirmado. La evaluación está activa.' }
}

/** Obtener URL firmada para el comprobante de pago de una evaluación. */
export async function getEvaluationProofUrl(path: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.storage
    .from('evaluation-proofs')
    .createSignedUrl(path, 60 * 60)
  return data?.signedUrl ?? null
}

// ─── Mutations (datos de la evaluación) ──────────────────────────────────────

export async function createEvaluation(
  playerId:    string,
  coachId:     string,
  title:       string,
  evaluatedAt?: string,
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('evaluations')
    .insert({
      player_id:    playerId,
      coach_id:     coachId,
      title,
      evaluated_at: evaluatedAt ?? new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Error al crear evaluación' }

  revalidatePath('/admin/evaluations')
  revalidatePath('/coach/evaluations')

  await createNotification(
    playerId,
    'Nueva evaluación programada',
    `Se ha programado una evaluación: "${title}"`,
    'evaluation_ready',
    '/player/my-evaluations',
  )

  return { id: (data as { id: string }).id }
}

export async function saveTechnicalShots(
  evaluationId: string,
  shots:        TechnicalShot[],
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  await supabase.from('eval_technical_shots').delete().eq('evaluation_id', evaluationId)

  if (shots.length > 0) {
    const { error } = await supabase.from('eval_technical_shots').insert(
      shots.map((s) => ({
        evaluation_id: evaluationId,
        stroke_group:  s.strokeGroup,
        stroke_name:   s.strokeName,
        s1: s.s1, s2: s.s2, s3: s.s3, s4: s.s4, s5: s.s5,
      })),
    )
    if (error) return { error: error.message }
  }

  const { data: evalMeta } = await supabase
    .from('evaluations')
    .select('player_id')
    .eq('id', evaluationId)
    .single()

  if (evalMeta) {
    await createNotification(
      (evalMeta as { player_id: string }).player_id,
      'Resultados técnicos registrados',
      'Los resultados de tu evaluación técnica han sido registrados.',
      'evaluation_ready',
      '/player/my-evaluations',
    )
  }

  revalidateEval(evaluationId)
  return null
}

export async function saveTacticalGames(
  evaluationId: string,
  games:        TacticalGame[],
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  await supabase.from('eval_tactical_games').delete().eq('evaluation_id', evaluationId)

  if (games.length > 0) {
    const { error } = await supabase.from('eval_tactical_games').insert(
      games.map((g) => ({
        evaluation_id: evaluationId,
        game_number:   g.gameNumber,
        pts_player:    g.ptsPlayer  ?? null,
        pts_rival:     g.ptsRival   ?? null,
        drive_stats:   g.driveStats,
        reves_stats:   g.revesStats,
      })),
    )
    if (error) return { error: error.message }
  }

  revalidateEval(evaluationId)
  return null
}

export async function saveAnthropometric(
  evaluationId: string,
  data:         AnthropometricData,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('eval_anthropometric').upsert(
    {
      evaluation_id:      evaluationId,
      peso:               data.peso               ?? null,
      talla:              data.talla              ?? null,
      pct_adiposo:        data.pctAdiposo         ?? null,
      pct_musculo:        data.pctMusculo         ?? null,
      edad_biologica:     data.edadBiologica      ?? null,
      grasa_visceral:     data.grasaVisceral      ?? null,
      tricipital:         data.tricipital         ?? null,
      bicipital:          data.bicipital          ?? null,
      subescapular:       data.subescapular       ?? null,
      iliocrestal:        data.iliocrestal        ?? null,
      supraespinal:       data.supraespinal       ?? null,
      abdominal:          data.abdominal          ?? null,
      muslo_pliegue:      data.musloPliegue       ?? null,
      pantorrilla_pliegue: data.pantorrillaPliegue ?? null,
      pecho_minimo:       data.pechoMinimo        ?? null,
      cintura:            data.cintura            ?? null,
      cadera:             data.cadera             ?? null,
      biceps_d_rel:       data.bicepsDRel         ?? null,
      biceps_d_con:       data.bicepsDCon         ?? null,
      biceps_i_rel:       data.bicepsIRel         ?? null,
      biceps_i_con:       data.bicepsICon         ?? null,
      antebrazo_d:        data.antebrazoD         ?? null,
      antebrazo_i:        data.antebrazoI         ?? null,
      muslo_d:            data.musloD             ?? null,
      muslo_i:            data.musloI             ?? null,
      pantorrilla_d:      data.pantorrillaD       ?? null,
      pantorrilla_i:      data.pantorrillaI       ?? null,
    },
    { onConflict: 'evaluation_id' },
  )

  if (error) return { error: error.message }
  revalidateEval(evaluationId)
  return null
}

export async function savePhysical(
  evaluationId: string,
  data:         PhysicalData,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('eval_physical').upsert(
    {
      evaluation_id:   evaluationId,
      sj_1:            data.sj1           ?? null,
      sj_2:            data.sj2           ?? null,
      sj_3:            data.sj3           ?? null,
      cmj_1:           data.cmj1          ?? null,
      cmj_2:           data.cmj2          ?? null,
      cmj_3:           data.cmj3          ?? null,
      abalakov_1:      data.abalakov1     ?? null,
      abalakov_2:      data.abalakov2     ?? null,
      abalakov_3:      data.abalakov3     ?? null,
      vel_10m_1:       data.vel10m1       ?? null,
      vel_10m_2:       data.vel10m2       ?? null,
      vel_10m_3:       data.vel10m3       ?? null,
      bolas_lateral_1: data.bolasLateral1 ?? null,
      bolas_lateral_2: data.bolasLateral2 ?? null,
      bolas_lateral_3: data.bolasLateral3 ?? null,
      bolas_frontal_1: data.bolasFrontal1 ?? null,
      bolas_frontal_2: data.bolasFrontal2 ?? null,
      bolas_frontal_3: data.bolasFrontal3 ?? null,
      desplaz_lat_d:   data.desplazLatD   ?? null,
      desplaz_lat_i:   data.desplazLatI   ?? null,
      zigzag_1:        data.zigzag1       ?? null,
      zigzag_2:        data.zigzag2       ?? null,
      zigzag_3:        data.zigzag3       ?? null,
      resistencia_5k:  data.resistencia5k ?? null,
    },
    { onConflict: 'evaluation_id' },
  )

  if (error) return { error: error.message }
  revalidateEval(evaluationId)
  return null
}

export async function updateEvaluationNotes(
  evaluationId: string,
  notes:        string,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('evaluations')
    .update({ notes })
    .eq('id', evaluationId)

  if (error) return { error: error.message }
  revalidateEval(evaluationId)
  return null
}

export async function shareEvaluation(
  evaluationId: string,
  share:        boolean,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('evaluations')
    .update({ is_shared: share })
    .eq('id', evaluationId)

  if (error) return { error: error.message }

  if (share) {
    const { data: evalMeta } = await supabase
      .from('evaluations')
      .select('player_id, title')
      .eq('id', evaluationId)
      .single()

    if (evalMeta) {
      const e = evalMeta as { player_id: string; title: string }
      await createNotification(
        e.player_id,
        'Resultados de evaluación disponibles',
        `Tu entrenador compartió los resultados de tu evaluación: "${e.title}"`,
        'evaluation_ready',
        '/player/my-evaluations',
      )
    }
  }

  revalidateEval(evaluationId)
  return null
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const EVAL_SELECT = 'id, title, evaluated_at, is_shared, notes, evaluation_status, scheduled_date, scheduled_time, payment_proof_url, payment_amount, player:profiles!player_id(id, full_name), coach:profiles!coach_id(id, full_name)'

function mapEval(e: any): EvaluationSummary {
  return {
    id:               e.id,
    title:            e.title,
    evaluatedAt:      e.evaluated_at,
    isShared:         e.is_shared,
    notes:            e.notes,
    evaluationStatus: e.evaluation_status as EvaluationStatus,
    scheduledDate:    e.scheduled_date    ?? null,
    scheduledTime:    e.scheduled_time    ?? null,
    paymentProofUrl:  e.payment_proof_url ?? null,
    paymentAmount:    e.payment_amount    ?? null,
    player:           e.player,
    coach:            e.coach,
  }
}

export async function getAllEvaluations(coachId?: string): Promise<EvaluationSummary[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  let query = db
    .from('evaluations')
    .select(EVAL_SELECT)
    .order('evaluated_at', { ascending: false })

  if (coachId) query = query.eq('coach_id', coachId)

  const { data } = await query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map(mapEval)
}

export async function getPlayerEvaluations(playerId?: string): Promise<EvaluationSummary[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const targetId = playerId ?? user.id

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('evaluations')
    .select(EVAL_SELECT)
    .eq('player_id', targetId)
    .order('evaluated_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map(mapEval)
}

export async function getEvaluation(id: string): Promise<EvaluationDetail | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: rawHeader } = await db
    .from('evaluations')
    .select('id, title, notes, evaluated_at, is_shared, player:profiles!player_id(id, full_name), coach:profiles!coach_id(id, full_name)')
    .eq('id', id)
    .single()

  if (!rawHeader) return null

  const header = rawHeader as {
    id: string; title: string; notes: string | null; evaluated_at: string; is_shared: boolean
    player: { id: string; full_name: string }
    coach:  { id: string; full_name: string }
  }

  const [shotsRes, gamesRes, anthropoRes, physicalRes] = await Promise.all([
    db.from('eval_technical_shots')
      .select('stroke_group, stroke_name, s1, s2, s3, s4, s5, hits, pct')
      .eq('evaluation_id', id)
      .order('stroke_name'),
    db.from('eval_tactical_games')
      .select('game_number, pts_player, pts_rival, drive_stats, reves_stats')
      .eq('evaluation_id', id)
      .order('game_number'),
    db.from('eval_anthropometric')
      .select('*')
      .eq('evaluation_id', id)
      .maybeSingle(),
    db.from('eval_physical')
      .select('*')
      .eq('evaluation_id', id)
      .maybeSingle(),
  ])

  const anthro = (anthropoRes as { data: Record<string, number | null> | null }).data
  const phys   = (physicalRes as { data: Record<string, number | null> | null }).data

  return {
    id:              header.id,
    title:           header.title,
    notes:           header.notes,
    evaluatedAt:     header.evaluated_at,
    isShared:        header.is_shared,
    player:          header.player,
    coach:           header.coach,
    technicalShots:  (shotsRes.data ?? []) as ShotRow[],
    tacticalGames:   (gamesRes.data ?? []) as TacticalGameRow[],
    anthropometric:  anthro ? {
      peso:               anthro.peso,
      talla:              anthro.talla,
      pctAdiposo:         anthro.pct_adiposo,
      pctMusculo:         anthro.pct_musculo,
      edadBiologica:      anthro.edad_biologica,
      grasaVisceral:      anthro.grasa_visceral,
      tricipital:         anthro.tricipital,
      bicipital:          anthro.bicipital,
      subescapular:       anthro.subescapular,
      iliocrestal:        anthro.iliocrestal,
      supraespinal:       anthro.supraespinal,
      abdominal:          anthro.abdominal,
      musloPliegue:       anthro.muslo_pliegue,
      pantorrillaPliegue: anthro.pantorrilla_pliegue,
      pechoMinimo:        anthro.pecho_minimo,
      cintura:            anthro.cintura,
      cadera:             anthro.cadera,
      bicepsDRel:         anthro.biceps_d_rel,
      bicepsDCon:         anthro.biceps_d_con,
      bicepsIRel:         anthro.biceps_i_rel,
      bicepsICon:         anthro.biceps_i_con,
      antebrazoD:         anthro.antebrazo_d,
      antebrazoI:         anthro.antebrazo_i,
      musloD:             anthro.muslo_d,
      musloI:             anthro.muslo_i,
      pantorrillaD:       anthro.pantorrilla_d,
      pantorrillaI:       anthro.pantorrilla_i,
    } : null,
    physical: phys ? {
      sj1: phys.sj_1, sj2: phys.sj_2, sj3: phys.sj_3,
      cmj1: phys.cmj_1, cmj2: phys.cmj_2, cmj3: phys.cmj_3,
      abalakov1: phys.abalakov_1, abalakov2: phys.abalakov_2, abalakov3: phys.abalakov_3,
      vel10m1: phys.vel_10m_1, vel10m2: phys.vel_10m_2, vel10m3: phys.vel_10m_3,
      bolasLateral1: phys.bolas_lateral_1, bolasLateral2: phys.bolas_lateral_2, bolasLateral3: phys.bolas_lateral_3,
      bolasFrontal1: phys.bolas_frontal_1, bolasFrontal2: phys.bolas_frontal_2, bolasFrontal3: phys.bolas_frontal_3,
      desplazLatD: phys.desplaz_lat_d, desplazLatI: phys.desplaz_lat_i,
      zigzag1: phys.zigzag_1, zigzag2: phys.zigzag_2, zigzag3: phys.zigzag_3,
      resistencia5k: phys.resistencia_5k,
    } : null,
  }
}

export async function getDashboardData(evaluationId: string): Promise<DashboardData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [shotsRes, gamesRes, physRes] = await Promise.all([
    db.from('eval_technical_shots')
      .select('stroke_group, pct')
      .eq('evaluation_id', evaluationId),
    db.from('eval_tactical_games')
      .select('drive_stats, reves_stats')
      .eq('evaluation_id', evaluationId),
    db.from('eval_physical')
      .select('*')
      .eq('evaluation_id', evaluationId)
      .maybeSingle(),
  ])

  const anthropoRes = await db
    .from('eval_anthropometric')
    .select('*')
    .eq('evaluation_id', evaluationId)
    .maybeSingle()

  // ── Technical ──
  const shots = (shotsRes.data ?? []) as { stroke_group: string; pct: string }[]

  const GROUPS = ['golpes_fondo', 'voleas', 'bandejas', 'smash'] as const
  const GROUP_LABELS: Record<string, string> = {
    golpes_fondo: 'Golpes de Fondo',
    voleas:       'Voleas',
    bandejas:     'Bandejas',
    smash:        'Smash',
  }

  let technical: DashboardData['technical'] = null
  if (shots.length > 0) {
    const byGroup: TechGroupResult[] = GROUPS.map((group) => {
      const groupShots = shots.filter((s) => s.stroke_group === group)
      const avgPct = groupShots.length
        ? groupShots.reduce((sum, s) => sum + Number(s.pct), 0) / groupShots.length
        : 0
      const light = trafficLight(avgPct)
      return {
        group,
        label:          GROUP_LABELS[group],
        avgPct:         Math.round(avgPct * 10) / 10,
        light,
        priority:       priority(light),
        recommendation: recommendation(light),
        shotCount:      groupShots.length,
      }
    }).filter((g) => g.shotCount > 0)

    const overallPct = byGroup.length
      ? byGroup.reduce((sum, g) => sum + g.avgPct, 0) / byGroup.length
      : 0

    technical = {
      byGroup,
      overallPct:   Math.round(overallPct * 10) / 10,
      overallLight: trafficLight(overallPct),
    }
  }

  // ── Tactical ──
  const games = (gamesRes.data ?? []) as { drive_stats: GameStats; reves_stats: GameStats }[]

  let tactical: DashboardData['tactical'] = null
  if (games.length > 0) {
    const WINNER_KEYS = ['w_drive', 'w_reves', 'w_smash', 'w_bandeja', 'w_volea'] as const
    const ERROR_KEYS  = ['e_drive', 'e_reves', 'e_smash', 'e_bandeja', 'e_volea'] as const

    const winnersByType: Record<string, number> = {}
    const errorsByType:  Record<string, number> = {}
    let totalWinners = 0
    let totalErrors  = 0

    for (const game of games) {
      for (const stats of [game.drive_stats, game.reves_stats]) {
        for (const k of WINNER_KEYS) {
          const v = (stats as Record<string, number>)[k] ?? 0
          winnersByType[k] = (winnersByType[k] ?? 0) + v
          totalWinners += v
        }
        for (const k of ERROR_KEYS) {
          const v = (stats as Record<string, number>)[k] ?? 0
          errorsByType[k] = (errorsByType[k] ?? 0) + v
          totalErrors += v
        }
      }
    }

    tactical = { games: games.length, totalWinners, totalErrors, winnersByType, errorsByType }
  }

  // ── Physical ──
  const phys = physRes.data as Record<string, number | null> | null

  let physical: DashboardData['physical'] = null
  if (phys) {
    physical = {
      bestSJ:           bestMax(phys.sj_1, phys.sj_2, phys.sj_3),
      bestCMJ:          bestMax(phys.cmj_1, phys.cmj_2, phys.cmj_3),
      bestAbalakov:     bestMax(phys.abalakov_1, phys.abalakov_2, phys.abalakov_3),
      bestVel10m:       bestMin(phys.vel_10m_1, phys.vel_10m_2, phys.vel_10m_3),
      bestBolasLateral: bestMin(phys.bolas_lateral_1, phys.bolas_lateral_2, phys.bolas_lateral_3),
      bestBolasFrontal: bestMin(phys.bolas_frontal_1, phys.bolas_frontal_2, phys.bolas_frontal_3),
      desplazLatD:      phys.desplaz_lat_d,
      desplazLatI:      phys.desplaz_lat_i,
      bestZigzag:       bestMin(phys.zigzag_1, phys.zigzag_2, phys.zigzag_3),
      resistencia5k:    phys.resistencia_5k,
    }
  }

  // ── Anthropometric ──
  const anthro = anthropoRes.data as Record<string, number | null> | null

  return {
    evaluationId,
    technical,
    tactical,
    physical,
    anthropometric: anthro ? {
      peso:               anthro.peso,
      talla:              anthro.talla,
      pctAdiposo:         anthro.pct_adiposo,
      pctMusculo:         anthro.pct_musculo,
      edadBiologica:      anthro.edad_biologica,
      grasaVisceral:      anthro.grasa_visceral,
      tricipital:         anthro.tricipital,
      bicipital:          anthro.bicipital,
      subescapular:       anthro.subescapular,
      iliocrestal:        anthro.iliocrestal,
      supraespinal:       anthro.supraespinal,
      abdominal:          anthro.abdominal,
      musloPliegue:       anthro.muslo_pliegue,
      pantorrillaPliegue: anthro.pantorrilla_pliegue,
      pechoMinimo:        anthro.pecho_minimo,
      cintura:            anthro.cintura,
      cadera:             anthro.cadera,
      bicepsDRel:         anthro.biceps_d_rel,
      bicepsDCon:         anthro.biceps_d_con,
      bicepsIRel:         anthro.biceps_i_rel,
      bicepsICon:         anthro.biceps_i_con,
      antebrazoD:         anthro.antebrazo_d,
      antebrazoI:         anthro.antebrazo_i,
      musloD:             anthro.muslo_d,
      musloI:             anthro.muslo_i,
      pantorrillaD:       anthro.pantorrilla_d,
      pantorrillaI:       anthro.pantorrilla_i,
    } : null,
  }
}

// ─── Player evolution dashboard ───────────────────────────────────────────────

export type PlayerEvolutionPoint = {
  evaluationId:     string
  title:            string
  date:             string
  techTotal:        number | null
  techFondo:        number | null
  techVoleas:       number | null
  techBandejas:     number | null
  techSmash:        number | null
  bestCMJ:          number | null
  bestVel10m:       number | null
  bestBolasLateral: number | null
}

// ─ new KPI + anthro types ─────────────────────────────────────────────────────

export type ShotKPI = {
  strokeName: string
  overallAvg: number | null
  firstPct:   number | null
  lastPct:    number | null
  delta:      number | null
  priority:   'alta' | 'media' | 'buena' | null
}

export type GroupKPI = {
  group:     ShotGroup
  label:     string
  lastAvg:   number | null
  priority:  'alta' | 'media' | 'buena' | null
  weakest:   ShotKPI | null
  strongest: ShotKPI | null
  allShots:  ShotKPI[]
}

export type AnthroPoint = {
  evaluationId: string
  date:         string
  peso:         number | null
  pctAdiposo:   number | null
  pctMusculo:   number | null
}

export type PlayerEvolutionData = {
  player:       { id: string; full_name: string }
  points:       PlayerEvolutionPoint[]
  groupKPIs:    GroupKPI[]
  anthroPoints: AnthroPoint[]
}

// ─────────────────────────────────────────────────────────────────────────────

function shotPriority(pct: number | null): 'alta' | 'media' | 'buena' | null {
  if (pct === null) return null
  if (pct < 40) return 'alta'
  if (pct < 70) return 'media'
  return 'buena'
}

export async function getPlayerEvolution(playerId: string): Promise<PlayerEvolutionData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: playerData } = await db
    .from('profiles')
    .select('id, full_name')
    .eq('id', playerId)
    .single()

  if (!playerData) return null

  const { data: evals } = await db
    .from('evaluations')
    .select('id, title, evaluated_at')
    .eq('player_id', playerId)
    .order('evaluated_at', { ascending: true })

  if (!evals || evals.length === 0) {
    return { player: playerData as { id: string; full_name: string }, points: [], groupKPIs: [], anthroPoints: [] }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const evalIds = (evals as any[]).map((e) => e.id as string)

  const [shotsRes, physRes, anthroRes] = await Promise.all([
    db.from('eval_technical_shots')
      .select('evaluation_id, stroke_group, stroke_name, pct')
      .in('evaluation_id', evalIds),
    db.from('eval_physical')
      .select('evaluation_id, cmj_1, cmj_2, cmj_3, vel_10m_1, vel_10m_2, vel_10m_3, bolas_lateral_1, bolas_lateral_2, bolas_lateral_3')
      .in('evaluation_id', evalIds),
    db.from('eval_anthropometric')
      .select('evaluation_id, peso, pct_adiposo, pct_musculo')
      .in('evaluation_id', evalIds),
  ])

  type ShotRow  = { evaluation_id: string; stroke_group: string; stroke_name: string; pct: string }
  type PhysRow  = {
    evaluation_id: string
    cmj_1: number | null; cmj_2: number | null; cmj_3: number | null
    vel_10m_1: number | null; vel_10m_2: number | null; vel_10m_3: number | null
    bolas_lateral_1: number | null; bolas_lateral_2: number | null; bolas_lateral_3: number | null
  }
  type AnthroRow = {
    evaluation_id: string
    peso: number | null; pct_adiposo: number | null; pct_musculo: number | null
  }

  const shotsByEval: Record<string, ShotRow[]> = {}
  for (const s of (shotsRes.data ?? []) as ShotRow[]) {
    if (!shotsByEval[s.evaluation_id]) shotsByEval[s.evaluation_id] = []
    shotsByEval[s.evaluation_id].push(s)
  }

  const physByEval: Record<string, PhysRow> = {}
  for (const p of (physRes.data ?? []) as PhysRow[]) {
    physByEval[p.evaluation_id] = p
  }

  const anthroByEval: Record<string, AnthroRow> = {}
  for (const a of (anthroRes.data ?? []) as AnthroRow[]) {
    anthroByEval[a.evaluation_id] = a
  }

  const avgOf = (nums: number[]): number | null =>
    nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length * 10) / 10 : null

  // ── Evolution points (charts) ──────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const points: PlayerEvolutionPoint[] = (evals as any[]).map((e) => {
    const shots = shotsByEval[e.id] ?? []

    const byGroup: Record<string, number[]> = {}
    for (const s of shots) {
      if (!byGroup[s.stroke_group]) byGroup[s.stroke_group] = []
      byGroup[s.stroke_group].push(Number(s.pct))
    }

    const techFondo    = avgOf(byGroup['golpes_fondo'] ?? [])
    const techVoleas   = avgOf(byGroup['voleas']       ?? [])
    const techBandejas = avgOf(byGroup['bandejas']     ?? [])
    const techSmash    = avgOf(byGroup['smash']        ?? [])

    const groupAvgs = [techFondo, techVoleas, techBandejas, techSmash].filter((v): v is number => v !== null)
    const techTotal = avgOf(groupAvgs)

    const phys = physByEval[e.id] ?? null

    return {
      evaluationId: e.id as string,
      title:        e.title as string,
      date:         e.evaluated_at as string,
      techTotal,
      techFondo,
      techVoleas,
      techBandejas,
      techSmash,
      bestCMJ:          phys ? bestMax(phys.cmj_1, phys.cmj_2, phys.cmj_3)                              : null,
      bestVel10m:       phys ? bestMin(phys.vel_10m_1, phys.vel_10m_2, phys.vel_10m_3)                  : null,
      bestBolasLateral: phys ? bestMin(phys.bolas_lateral_1, phys.bolas_lateral_2, phys.bolas_lateral_3): null,
    }
  })

  // ── Group KPIs (per-shot analysis) ────────────────────────────────────────
  const GROUP_META: { group: ShotGroup; label: string }[] = [
    { group: 'golpes_fondo', label: 'Golpes de Fondo' },
    { group: 'voleas',       label: 'Voleas'          },
    { group: 'bandejas',     label: 'Bandejas'        },
    { group: 'smash',        label: 'Smash'           },
  ]

  const groupKPIs: GroupKPI[] = GROUP_META.map(({ group, label }) => {
    const groupInfo  = STROKE_GROUPS.find(g => g.group === group)
    const strokeList = groupInfo?.strokes ?? []

    // Evaluations with data for this group, in chronological order
    const evalsWithGroup = evalIds.filter(eid =>
      (shotsByEval[eid] ?? []).some(s => s.stroke_group === group),
    )

    if (evalsWithGroup.length === 0) {
      return { group, label, lastAvg: null, priority: null, weakest: null, strongest: null, allShots: [] }
    }

    const firstEvalId = evalsWithGroup[0]
    const lastEvalId  = evalsWithGroup[evalsWithGroup.length - 1]
    const multiEval   = firstEvalId !== lastEvalId

    // Last eval's group avg
    const lastEvalShots = (shotsByEval[lastEvalId] ?? []).filter(s => s.stroke_group === group)
    const lastAvg = avgOf(lastEvalShots.map(s => Number(s.pct)))

    // Per-stroke KPIs
    const allShots: ShotKPI[] = strokeList.flatMap(strokeName => {
      const allPcts: number[] = []
      let firstPct: number | null = null
      let lastPct:  number | null = null

      for (const eid of evalsWithGroup) {
        const shot = (shotsByEval[eid] ?? []).find(
          s => s.stroke_name === strokeName && s.stroke_group === group,
        )
        if (shot) {
          const pct = Number(shot.pct)
          allPcts.push(pct)
          if (eid === firstEvalId) firstPct = pct
          if (eid === lastEvalId)  lastPct  = pct
        }
      }

      if (allPcts.length === 0) return []

      const overallAvg = avgOf(allPcts)
      const delta = multiEval && firstPct !== null && lastPct !== null
        ? Math.round((lastPct - firstPct) * 10) / 10
        : null

      return [{ strokeName, overallAvg, firstPct, lastPct, delta, priority: shotPriority(overallAvg) }]
    })

    // Sort: weakest first (ascending overallAvg)
    allShots.sort((a, b) => (a.overallAvg ?? 0) - (b.overallAvg ?? 0))

    const weakest   = allShots[0]   ?? null
    const strongest = allShots[allShots.length - 1] ?? null

    return { group, label, lastAvg, priority: shotPriority(lastAvg), weakest, strongest, allShots }
  }).filter(g => g.allShots.length > 0)

  // ── Anthropometric points ─────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anthroPoints: AnthroPoint[] = (evals as any[]).flatMap((e) => {
    const a = anthroByEval[e.id] ?? null
    if (!a || (a.peso === null && a.pct_adiposo === null && a.pct_musculo === null)) return []
    return [{
      evaluationId: e.id as string,
      date:         e.evaluated_at as string,
      peso:         a.peso,
      pctAdiposo:   a.pct_adiposo,
      pctMusculo:   a.pct_musculo,
    }]
  })

  return {
    player:       playerData as { id: string; full_name: string },
    points,
    groupKPIs,
    anthroPoints,
  }
}

// ─── Current player's own evolution ──────────────────────────────────────────

export async function getMyEvolution(): Promise<PlayerEvolutionData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return getPlayerEvolution(user.id)
}

// ─── Players list for selector ────────────────────────────────────────────────

export type PlayerOption = { id: string; full_name: string }

export async function getPlayers(): Promise<PlayerOption[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'player')
    .eq('is_active', true)
    .order('full_name')
  return (data ?? []) as PlayerOption[]
}
