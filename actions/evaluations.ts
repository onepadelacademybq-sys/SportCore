'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { ShotGroup } from '@/lib/eval-strokes'

// ─── Types ────────────────────────────────────────────────────────────────────

export type { ShotGroup }

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
  id:          string
  title:       string
  evaluatedAt: string
  isShared:    boolean
  notes:       string | null
  player:      { id: string; full_name: string }
  coach:       { id: string; full_name: string }
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

// ─── Mutations ────────────────────────────────────────────────────────────────

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
  revalidateEval(evaluationId)
  return null
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getAllEvaluations(coachId?: string): Promise<EvaluationSummary[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  let query = db
    .from('evaluations')
    .select('id, title, evaluated_at, is_shared, notes, player:profiles!player_id(id, full_name), coach:profiles!coach_id(id, full_name)')
    .order('evaluated_at', { ascending: false })

  if (coachId) query = query.eq('coach_id', coachId)

  const { data } = await query

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((e) => ({
    id:          e.id,
    title:       e.title,
    evaluatedAt: e.evaluated_at,
    isShared:    e.is_shared,
    notes:       e.notes,
    player:      e.player,
    coach:       e.coach,
  }))
}

export async function getPlayerEvaluations(playerId?: string): Promise<EvaluationSummary[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const targetId = playerId ?? user.id

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('evaluations')
    .select('id, title, evaluated_at, is_shared, notes, player:profiles!player_id(id, full_name), coach:profiles!coach_id(id, full_name)')
    .eq('player_id', targetId)
    .order('evaluated_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((e) => ({
    id:          e.id,
    title:       e.title,
    evaluatedAt: e.evaluated_at,
    isShared:    e.is_shared,
    notes:       e.notes,
    player:      e.player,
    coach:       e.coach,
  }))
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
