'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calcCourtCost, recommendedCourts } from '@/lib/tournaments/costs'
import {
  SUPER_8_ROUNDS,
  generateIndividualRounds,
  generatePairsRoundRobin,
  assignCourtsFromRanking,
  isAmericanoFormat,
  ROUND_PAIR_FORMATS,
} from '@/lib/tournaments/americano'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TournamentStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled'
export type TournamentFormat =
  | 'eliminatoria'
  | 'grupos'
  | 'grupos_y_eliminatoria'
  | 'americano_individual'
  | 'americano_parejas'
  | 'americano_rey_pista'
  | 'super_8'
  | 'americano_mixto'
export type EntryStatus = 'pending' | 'confirmed' | 'eliminated' | 'withdrawn'
export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export interface Tournament {
  id: string
  name: string
  format: TournamentFormat
  category: string
  start_date: string
  end_date: string
  status: TournamentStatus
  max_entries: number | null
  entry_fee: string
  description: string | null
  requires_partner: boolean
  created_at: string
  // Planta física
  num_courts: number | null
  tournament_date: string | null
  start_time: string | null
  end_time: string | null
  court_cost_total: string | null
  entries?: Array<{ id: string; status: EntryStatus }>
}

export interface TournamentEntry {
  id: string
  tournament_id: string
  player1_id: string
  player2_id: string | null
  registered_by: string
  status: EntryStatus
  registered_at: string
  player1?: { full_name: string } | null
  player2?: { full_name: string } | null
  tournament?: {
    id: string; name: string; format: TournamentFormat
    category: string; start_date: string; end_date: string; status: TournamentStatus
  } | null
}

export interface TournamentMatch {
  id: string
  tournament_id: string
  entry1_id: string
  entry2_id: string | null
  round: string
  scheduled_at: string | null
  court_id: string | null
  score_entry1: string | null
  score_entry2: string | null
  winner_entry_id: string | null
  status: MatchStatus
  entry1?: {
    id: string; player1_id: string; player2_id: string | null
    player1?: { full_name: string } | null
    player2?: { full_name: string } | null
  } | null
  entry2?: {
    id: string; player1_id: string; player2_id: string | null
    player1?: { full_name: string } | null
    player2?: { full_name: string } | null
  } | null
  court?: { name: string } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Sin permisos')
  return { supabase, userId: user.id }
}

function entryLabel(entry: TournamentMatch['entry1']): string {
  if (!entry) return '—'
  const p1 = (entry.player1 as any)?.full_name ?? 'Jugador'
  const p2 = (entry.player2 as any)?.full_name
  return p2 ? `${p1} / ${p2}` : p1
}

export { entryLabel }

// ─── Queries ─────────────────────────────────────────────────────────────────

const TOURNAMENT_SELECT_BASE = `
  id, name, format, category, start_date, end_date, status,
  max_entries, entry_fee, requires_partner, description, created_at,
  num_courts, tournament_date, start_time, end_time, court_cost_total
`

export async function getTournaments(): Promise<Tournament[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tournaments')
    .select(`${TOURNAMENT_SELECT_BASE}, entries:tournament_entries(id, status)`)
    .order('start_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as Tournament[]
}

export async function getOpenTournaments(): Promise<Tournament[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tournaments')
    .select(`${TOURNAMENT_SELECT_BASE}, entries:tournament_entries(id, status)`)
    .in('status', ['open', 'in_progress', 'completed'])
    .order('start_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as Tournament[]
}

export async function getTournamentById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      ${TOURNAMENT_SELECT_BASE},
      entries:tournament_entries(
        id, status, registered_at, player1_id, player2_id, registered_by, is_round_pair,
        player1:profiles!player1_id(full_name),
        player2:profiles!player2_id(full_name)
      ),
      matches:tournament_matches(
        id, round, round_number, court_number, scheduled_at, score_entry1, score_entry2,
        winner_entry_id, status, entry1_id, entry2_id, court_id,
        entry1:tournament_entries!entry1_id(
          id, player1_id, player2_id, is_round_pair,
          player1:profiles!player1_id(full_name),
          player2:profiles!player2_id(full_name)
        ),
        entry2:tournament_entries!entry2_id(
          id, player1_id, player2_id, is_round_pair,
          player1:profiles!player1_id(full_name),
          player2:profiles!player2_id(full_name)
        ),
        court:courts!court_id(name)
      )
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getMyTournamentEntries(playerId: string): Promise<TournamentEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tournament_entries')
    .select(`
      id, status, registered_at, player1_id, player2_id, registered_by, tournament_id,
      player1:profiles!player1_id(full_name),
      player2:profiles!player2_id(full_name),
      tournament:tournaments(id, name, format, category, start_date, end_date, status)
    `)
    .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
    .order('registered_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as TournamentEntry[]
}

// ─── Admin: Tournament CRUD ──────────────────────────────────────────────────

export async function createTournamentAction(_: unknown, formData: FormData) {
  try {
    const { supabase, userId } = await requireAdmin()

    const name = (formData.get('name') as string)?.trim()
    const format = formData.get('format') as TournamentFormat
    const category = (formData.get('category') as string)?.trim()
    const start_date = formData.get('start_date') as string
    const end_date = formData.get('end_date') as string
    const max_entries_raw = formData.get('max_entries') as string
    const max_entries = max_entries_raw ? Number(max_entries_raw) : null
    const entry_fee = Number(formData.get('entry_fee') ?? 0)
    const description = ((formData.get('description') as string) ?? '').trim() || null
    const requires_partner = formData.get('requires_partner') === 'true'

    // Planta física (optional at creation)
    const tournament_date = (formData.get('tournament_date') as string) || null
    const start_time = (formData.get('start_time') as string) || null
    const end_time = (formData.get('end_time') as string) || null
    const num_courts_raw = formData.get('num_courts') as string
    const num_courts = num_courts_raw ? Number(num_courts_raw) : null
    const court_cost_total = (tournament_date && start_time && end_time && num_courts)
      ? calcCourtCost(tournament_date, start_time, end_time, num_courts)
      : null

    if (!name || !format || !category || !start_date || !end_date) {
      return { error: 'Completa todos los campos requeridos' }
    }
    if (new Date(end_date) < new Date(start_date)) {
      return { error: 'La fecha de fin no puede ser anterior a la de inicio' }
    }

    const { error } = await supabase.from('tournaments').insert({
      name, format, category, start_date, end_date,
      max_entries, entry_fee, description, requires_partner,
      tournament_date, start_time, end_time, num_courts, court_cost_total,
      created_by: userId,
    })

    if (error) return { error: error.message }
    revalidatePath('/admin/tournaments')
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Error al crear el torneo' }
  }
}

export async function updateTournamentStatusAction(id: string, status: TournamentStatus) {
  try {
    const { supabase, userId } = await requireAdmin()
    const { error } = await supabase.from('tournaments').update({ status }).eq('id', id)
    if (error) return { error: error.message }

    // When starting the tournament, record court cost as a financial expense
    if (status === 'in_progress') {
      const { data: t } = await supabase
        .from('tournaments')
        .select('name, court_cost_total, tournament_date')
        .eq('id', id).single()

      if (t && t.court_cost_total && Number(t.court_cost_total) > 0) {
        const txDate = t.tournament_date ?? new Date().toISOString().slice(0, 10)
        await supabase.from('financial_transactions').insert({
          type: 'expense',
          category: 'court_cost',
          amount: Number(t.court_cost_total),
          description: `Alquiler de canchas — Torneo: ${t.name}`,
          date: txDate,
          created_by: userId,
        })
      }
    }

    revalidatePath('/admin/tournaments')
    revalidatePath(`/admin/tournaments/${id}`)
    revalidatePath('/player/tournaments')
    revalidatePath('/coach/tournaments')
    revalidatePath('/admin/finances')
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Error actualizando estado' }
  }
}

export async function updateTournamentVenueAction(_: unknown, formData: FormData) {
  try {
    const { supabase } = await requireAdmin()

    const id = formData.get('tournament_id') as string
    const tournament_date = (formData.get('tournament_date') as string) || null
    const start_time = (formData.get('start_time') as string) || null
    const end_time = (formData.get('end_time') as string) || null
    const num_courts_raw = formData.get('num_courts') as string
    const num_courts = num_courts_raw ? Number(num_courts_raw) : null

    if (!id) return { error: 'ID de torneo requerido' }
    if (start_time && end_time) {
      const [sh, sm] = start_time.split(':').map(Number)
      const [eh, em] = end_time.split(':').map(Number)
      if (eh * 60 + em <= sh * 60 + sm) {
        return { error: 'La hora de fin debe ser posterior a la de inicio' }
      }
    }

    const court_cost_total = (tournament_date && start_time && end_time && num_courts)
      ? calcCourtCost(tournament_date, start_time, end_time, num_courts)
      : null

    const { error } = await supabase.from('tournaments').update({
      tournament_date, start_time, end_time, num_courts, court_cost_total,
    }).eq('id', id)

    if (error) return { error: error.message }
    revalidatePath(`/admin/tournaments/${id}`)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Error guardando planta física' }
  }
}

// ─── Admin: Entry Management ──────────────────────────────────────────────────

export async function confirmEntryAction(entryId: string) {
  try {
    const { supabase } = await requireAdmin()
    const { data: entry } = await supabase
      .from('tournament_entries').select('tournament_id').eq('id', entryId).single()
    const { error } = await supabase
      .from('tournament_entries').update({ status: 'confirmed' }).eq('id', entryId)
    if (error) return { error: error.message }
    revalidatePath(`/admin/tournaments/${entry?.tournament_id}`)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Error' }
  }
}

export async function rejectEntryAction(entryId: string) {
  try {
    const { supabase } = await requireAdmin()
    const { data: entry } = await supabase
      .from('tournament_entries').select('tournament_id').eq('id', entryId).single()
    const { error } = await supabase
      .from('tournament_entries').update({ status: 'withdrawn' }).eq('id', entryId)
    if (error) return { error: error.message }
    revalidatePath(`/admin/tournaments/${entry?.tournament_id}`)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Error' }
  }
}

// ─── Admin: Bracket / Round Generation ───────────────────────────────────────

// Helper: delete all round_pair entries for a tournament (and their matches first)
async function cleanupRoundPairs(supabase: Awaited<ReturnType<typeof createClient>>, tournamentId: string) {
  const { data: rpEntries } = await supabase
    .from('tournament_entries').select('id')
    .eq('tournament_id', tournamentId).eq('is_round_pair', true)

  if (rpEntries && rpEntries.length > 0) {
    const ids = rpEntries.map(e => e.id)
    // Delete matches referencing these entries (entry1 side)
    await supabase.from('tournament_matches').delete()
      .eq('tournament_id', tournamentId).in('entry1_id', ids)
    // Delete matches referencing these entries (entry2 side)
    await supabase.from('tournament_matches').delete()
      .eq('tournament_id', tournamentId).in('entry2_id', ids)
    // Now safe to delete the entries
    await supabase.from('tournament_entries').delete().in('id', ids)
  }
}

// Helper: insert one round_pair entry and return its id
async function insertRoundPair(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string,
  player1Id: string,
  player2Id: string,
  registeredBy: string,
): Promise<string> {
  const { data, error } = await supabase.from('tournament_entries').insert({
    tournament_id: tournamentId,
    player1_id: player1Id,
    player2_id: player2Id,
    registered_by: registeredBy,
    status: 'confirmed',
    is_round_pair: true,
  }).select('id').single()
  if (error || !data) throw new Error(error?.message ?? 'Error creando pareja de ronda')
  return data.id as string
}

export async function generateMatchesAction(tournamentId: string) {
  try {
    const { supabase, userId } = await requireAdmin()

    const { data: tournament } = await supabase
      .from('tournaments').select('format, status').eq('id', tournamentId).single()

    if (!tournament) return { error: 'Torneo no encontrado' }
    if (!['open', 'in_progress'].includes(tournament.status as string)) {
      return { error: 'El torneo debe estar abierto o en progreso' }
    }

    // Confirm no completed matches (can't regenerate once results exist)
    const { count: doneCount } = await supabase
      .from('tournament_matches').select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId).eq('status', 'completed')
    if (doneCount && doneCount > 0) {
      return { error: 'No se puede regenerar: ya hay partidos con resultado registrado.' }
    }

    // Fetch confirmed entries (non-round-pair = real inscriptions)
    const { data: entries } = await supabase
      .from('tournament_entries')
      .select('id, player1_id, player2_id')
      .eq('tournament_id', tournamentId)
      .eq('status', 'confirmed')
      .eq('is_round_pair', false)

    if (!entries || entries.length < 2) {
      return { error: 'Se necesitan al menos 2 inscripciones confirmadas' }
    }

    // Cast entries to known type (Supabase infers unknown for dynamic selects)
    const typedEntries = entries as Array<{ id: string; player1_id: string; player2_id: string | null }>

    const fmt = tournament.format as string

    // ── americano_individual / americano_mixto ─────────────────────────────
    if (fmt === 'americano_individual' || fmt === 'americano_mixto') {
      const n = typedEntries.length
      if (n < 4)  return { error: 'Se necesitan al menos 4 jugadores' }
      if (n % 4 !== 0) return { error: `Necesitas múltiplo de 4 jugadores (tienes ${n}). Confirma o retira inscripciones hasta ajustar.` }

      await cleanupRoundPairs(supabase, tournamentId)
      await supabase.from('tournament_matches').delete().eq('tournament_id', tournamentId).eq('status', 'scheduled')

      const numRounds = Math.min(n - 1, 9)
      const schedule = generateIndividualRounds(n, numRounds)
      const matchRows: Record<string, unknown>[] = []

      for (const [ri, round] of schedule.entries()) {
        for (const [mi, [a, b, c, d]] of round.entries()) {
          const p1 = typedEntries[a].player1_id
          const p2 = typedEntries[b].player1_id
          const p3 = typedEntries[c].player1_id
          const p4 = typedEntries[d].player1_id

          const pair1Id = await insertRoundPair(supabase, tournamentId, p1, p2, userId)
          const pair2Id = await insertRoundPair(supabase, tournamentId, p3, p4, userId)

          matchRows.push({
            tournament_id: tournamentId,
            entry1_id: pair1Id,
            entry2_id: pair2Id,
            round: `Ronda ${ri + 1}`,
            round_number: ri + 1,
            court_number: mi + 1,
            status: 'scheduled',
          })
        }
      }

      if (matchRows.length > 0) {
        const { error } = await supabase.from('tournament_matches').insert(matchRows)
        if (error) return { error: error.message }
      }

    // ── super_8 ────────────────────────────────────────────────────────────
    } else if (fmt === 'super_8') {
      if (typedEntries.length !== 8) {
        return { error: `Super 8 requiere exactamente 8 jugadores (tienes ${typedEntries.length})` }
      }

      await cleanupRoundPairs(supabase, tournamentId)
      await supabase.from('tournament_matches').delete().eq('tournament_id', tournamentId).eq('status', 'scheduled')

      const matchRows: Record<string, unknown>[] = []

      for (const [ri, roundMatches] of SUPER_8_ROUNDS.entries()) {
        for (const [mi, [a, b, c, d]] of roundMatches.entries()) {
          const p1 = typedEntries[a].player1_id
          const p2 = typedEntries[b].player1_id
          const p3 = typedEntries[c].player1_id
          const p4 = typedEntries[d].player1_id

          const pair1Id = await insertRoundPair(supabase, tournamentId, p1, p2, userId)
          const pair2Id = await insertRoundPair(supabase, tournamentId, p3, p4, userId)

          matchRows.push({
            tournament_id: tournamentId,
            entry1_id: pair1Id,
            entry2_id: pair2Id,
            round: `Ronda ${ri + 1}`,
            round_number: ri + 1,
            court_number: mi + 1,
            status: 'scheduled',
          })
        }
      }

      const { error } = await supabase.from('tournament_matches').insert(matchRows)
      if (error) return { error: error.message }

    // ── americano_parejas ─────────────────────────────────────────────────
    } else if (fmt === 'americano_parejas') {
      await supabase.from('tournament_matches').delete().eq('tournament_id', tournamentId).eq('status', 'scheduled')

      const roundRobin = generatePairsRoundRobin(typedEntries.length)
      const matchRows: Record<string, unknown>[] = []

      for (const [ri, round] of roundRobin.entries()) {
        for (const [mi, [i, j]] of round.entries()) {
          matchRows.push({
            tournament_id: tournamentId,
            entry1_id: typedEntries[i].id,
            entry2_id: typedEntries[j].id,
            round: `Ronda ${ri + 1}`,
            round_number: ri + 1,
            court_number: mi + 1,
            status: 'scheduled',
          })
        }
      }

      if (matchRows.length > 0) {
        const { error } = await supabase.from('tournament_matches').insert(matchRows)
        if (error) return { error: error.message }
      }

    // ── americano_rey_pista (round 1 only) ────────────────────────────────
    } else if (fmt === 'americano_rey_pista') {
      await supabase.from('tournament_matches').delete().eq('tournament_id', tournamentId).eq('status', 'scheduled')

      const shuffled = [...typedEntries].sort(() => Math.random() - 0.5)
      const courts = assignCourtsFromRanking(shuffled.map(e => e.id))
      const matchRows: Record<string, unknown>[] = courts.map(c => ({
        tournament_id: tournamentId,
        entry1_id: c.entry1_id,
        entry2_id: c.entry2_id,
        round: 'Ronda 1',
        round_number: 1,
        court_number: c.court_number,
        status: 'scheduled',
      }))

      if (matchRows.length > 0) {
        const { error } = await supabase.from('tournament_matches').insert(matchRows)
        if (error) return { error: error.message }
      }

    // ── grupos ─────────────────────────────────────────────────────────────
    } else if (fmt === 'grupos') {
      await supabase.from('tournament_matches').delete().eq('tournament_id', tournamentId).eq('status', 'scheduled')

      const rows: Record<string, unknown>[] = []
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          rows.push({
            tournament_id: tournamentId,
            entry1_id: entries[i].id,
            entry2_id: entries[j].id,
            round: 'Fase de grupos',
            status: 'scheduled',
          })
        }
      }
      if (rows.length > 0) {
        const { error } = await supabase.from('tournament_matches').insert(rows)
        if (error) return { error: error.message }
      }

    // ── eliminatoria / grupos_y_eliminatoria ──────────────────────────────
    } else {
      await supabase.from('tournament_matches').delete().eq('tournament_id', tournamentId).eq('status', 'scheduled')

      const shuffled = [...entries].sort(() => Math.random() - 0.5)
      const totalRounds = Math.ceil(Math.log2(shuffled.length))
      const roundName = totalRounds <= 1 ? 'Final'
        : totalRounds === 2 ? 'Semifinal'
        : totalRounds === 3 ? 'Cuartos de final'
        : totalRounds === 4 ? 'Octavos de final'
        : 'Ronda 1'

      const rows: Record<string, unknown>[] = []
      for (let i = 0; i < shuffled.length - 1; i += 2) {
        rows.push({
          tournament_id: tournamentId,
          entry1_id: shuffled[i].id,
          entry2_id: shuffled[i + 1].id,
          round: roundName,
          status: 'scheduled',
        })
      }
      if (shuffled.length % 2 !== 0) {
        rows.push({
          tournament_id: tournamentId,
          entry1_id: shuffled[shuffled.length - 1].id,
          entry2_id: null,
          round: roundName,
          status: 'completed',
          winner_entry_id: shuffled[shuffled.length - 1].id,
          score_entry1: 'BYE',
        })
      }
      if (rows.length > 0) {
        const { error } = await supabase.from('tournament_matches').insert(rows)
        if (error) return { error: error.message }
      }
    }

    await supabase.from('tournaments').update({ status: 'in_progress' }).eq('id', tournamentId)
    revalidatePath(`/admin/tournaments/${tournamentId}`)
    revalidatePath('/admin/tournaments')
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Error generando el cuadro' }
  }
}

// ─── Rey de pista: siguiente ronda ────────────────────────────────────────────

export async function generateNextReyPistaRoundAction(tournamentId: string) {
  try {
    const { supabase } = await requireAdmin()

    // Get all matches with results to compute cumulative stats per pair
    const { data: allMatches } = await supabase
      .from('tournament_matches')
      .select('entry1_id, entry2_id, winner_entry_id, score_entry1, score_entry2, status, round_number')
      .eq('tournament_id', tournamentId)
      .order('round_number', { ascending: true })

    if (!allMatches) return { error: 'No se encontraron partidos' }

    // Cast to typed array
    const typedMatches = allMatches as Array<{
      entry1_id: string; entry2_id: string | null; winner_entry_id: string | null
      score_entry1: string | null; score_entry2: string | null; status: string; round_number: number | null
    }>

    // Find last round_number
    const maxRound = Math.max(...typedMatches.map(m => m.round_number ?? 0))
    const lastRoundMatches = typedMatches.filter(m => (m.round_number ?? 0) === maxRound)

    const pending = lastRoundMatches.filter(m => m.status !== 'completed')
    if (pending.length > 0) {
      return { error: `Faltan ${pending.length} partido${pending.length !== 1 ? 's' : ''} por completar en esta ronda` }
    }

    // Compute cumulative wins + points per pair entry
    const stats: Record<string, { wins: number; points: number }> = {}
    function credit(entryId: string, points: number, won: boolean) {
      if (!stats[entryId]) stats[entryId] = { wins: 0, points: 0 }
      stats[entryId].points += points
      if (won) stats[entryId].wins++
    }

    for (const m of typedMatches) {
      if (m.status !== 'completed') continue
      const s1 = parseInt(m.score_entry1 ?? '0', 10) || 0
      const s2 = parseInt(m.score_entry2 ?? '0', 10) || 0
      const e1Won = m.winner_entry_id === m.entry1_id
      credit(m.entry1_id, s1, e1Won)
      if (m.entry2_id) credit(m.entry2_id, s2, !e1Won)
    }

    // Get all pair entries for this tournament
    const { data: rawPairEntries } = await supabase
      .from('tournament_entries')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('status', 'confirmed')
      .eq('is_round_pair', false)

    if (!rawPairEntries || rawPairEntries.length < 2) {
      return { error: 'No hay parejas suficientes' }
    }

    const pairEntries = rawPairEntries as Array<{ id: string }>

    // Sort by wins desc, then points desc
    const ranked = [...pairEntries].sort((a, b) => {
      const sa = stats[a.id] ?? { wins: 0, points: 0 }
      const sb = stats[b.id] ?? { wins: 0, points: 0 }
      return sb.wins !== sa.wins ? sb.wins - sa.wins : sb.points - sa.points
    })

    const nextRound = maxRound + 1
    const courts = assignCourtsFromRanking(ranked.map(e => e.id))

    const rows: Record<string, unknown>[] = courts.map(c => ({
      tournament_id: tournamentId,
      entry1_id: c.entry1_id,
      entry2_id: c.entry2_id,
      round: `Ronda ${nextRound}`,
      round_number: nextRound,
      court_number: c.court_number,
      status: 'scheduled',
    }))

    const { error } = await supabase.from('tournament_matches').insert(rows)
    if (error) return { error: error.message }

    revalidatePath(`/admin/tournaments/${tournamentId}`)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Error generando siguiente ronda' }
  }
}

export async function createNextRoundAction(tournamentId: string, currentRound: string) {
  try {
    const { supabase } = await requireAdmin()

    const { data: roundMatches } = await supabase
      .from('tournament_matches').select('id, winner_entry_id, status')
      .eq('tournament_id', tournamentId).eq('round', currentRound)

    if (!roundMatches) return { error: 'Ronda no encontrada' }

    const pending = roundMatches.filter(m => m.status !== 'completed')
    if (pending.length > 0) {
      return { error: `Faltan ${pending.length} partido${pending.length !== 1 ? 's' : ''} por completar en esta ronda` }
    }

    const winners = roundMatches.map(m => m.winner_entry_id).filter(Boolean) as string[]
    if (winners.length < 2) return { success: true, finished: true }

    const nextRoundName = winners.length === 2 ? 'Final'
      : winners.length <= 4 ? 'Semifinal'
      : winners.length <= 8 ? 'Cuartos de final'
      : winners.length <= 16 ? 'Octavos de final'
      : `Ronda (${winners.length} equipos)`

    const rows: Record<string, unknown>[] = []
    for (let i = 0; i < winners.length - 1; i += 2) {
      rows.push({
        tournament_id: tournamentId,
        entry1_id: winners[i],
        entry2_id: winners[i + 1],
        round: nextRoundName,
        status: 'scheduled',
      })
    }
    if (winners.length % 2 !== 0) {
      rows.push({
        tournament_id: tournamentId,
        entry1_id: winners[winners.length - 1],
        entry2_id: null,
        round: nextRoundName,
        status: 'completed',
        winner_entry_id: winners[winners.length - 1],
        score_entry1: 'BYE',
        score_entry2: null,
      })
    }

    const { error } = await supabase.from('tournament_matches').insert(rows)
    if (error) return { error: error.message }
    revalidatePath(`/admin/tournaments/${tournamentId}`)
    return { success: true, finished: false }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Error creando siguiente ronda' }
  }
}

// ─── Admin: Match Results ────────────────────────────────────────────────────

export async function recordMatchResultAction(
  _: unknown,
  formData: FormData,
) {
  try {
    const { supabase } = await requireAdmin()

    const matchId = formData.get('match_id') as string
    const scoreEntry1 = (formData.get('score_entry1') as string)?.trim()
    const scoreEntry2 = (formData.get('score_entry2') as string)?.trim()
    const winnerEntryId = formData.get('winner_entry_id') as string

    if (!matchId || !winnerEntryId) return { error: 'Datos incompletos' }

    const { data: match } = await supabase
      .from('tournament_matches').select('tournament_id, entry1_id, entry2_id')
      .eq('id', matchId).single()

    if (!match) return { error: 'Partido no encontrado' }
    if (winnerEntryId !== match.entry1_id && winnerEntryId !== match.entry2_id) {
      return { error: 'El ganador debe ser uno de los dos equipos' }
    }

    const { error } = await supabase.from('tournament_matches').update({
      score_entry1: scoreEntry1 || null,
      score_entry2: scoreEntry2 || null,
      winner_entry_id: winnerEntryId,
      status: 'completed',
    }).eq('id', matchId)

    if (error) return { error: error.message }

    // Only eliminate losers in bracket formats — not in americano/grupos (everyone plays all rounds)
    const { data: tournamentData } = await supabase
      .from('tournaments').select('format').eq('id', match.tournament_id as string).single()
    const eliminatoryFormats = ['eliminatoria', 'grupos_y_eliminatoria']
    const loserEntryId = winnerEntryId === match.entry1_id ? match.entry2_id : match.entry1_id
    if (loserEntryId && eliminatoryFormats.includes((tournamentData?.format as string | null) ?? '')) {
      await supabase
        .from('tournament_entries').update({ status: 'eliminated' }).eq('id', loserEntryId)
    }

    revalidatePath(`/admin/tournaments/${match.tournament_id}`)
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Error registrando resultado' }
  }
}

// ─── Player Actions ───────────────────────────────────────────────────────────

export async function registerForTournamentAction(_: unknown, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const tournamentId = formData.get('tournament_id') as string
    const player2Id = ((formData.get('player2_id') as string) ?? '').trim() || null

    const { data: tournament } = await supabase
      .from('tournaments')
      .select('status, max_entries, requires_partner')
      .eq('id', tournamentId).single()

    if (!tournament || tournament.status !== 'open') {
      return { error: 'El torneo no está abierto para inscripciones' }
    }
    if (tournament.requires_partner && !player2Id) {
      return { error: 'Este torneo requiere inscribirse con pareja' }
    }

    // Already registered?
    const { data: existing } = await supabase
      .from('tournament_entries').select('id')
      .eq('tournament_id', tournamentId)
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .neq('status', 'withdrawn')

    if (existing && existing.length > 0) {
      return { error: 'Ya estás inscrito en este torneo' }
    }

    // Capacity check
    if (tournament.max_entries) {
      const { count } = await supabase
        .from('tournament_entries').select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId).neq('status', 'withdrawn')
      if (count !== null && count >= Number(tournament.max_entries)) {
        return { error: 'El torneo ya alcanzó el máximo de inscripciones' }
      }
    }

    const { error } = await supabase.from('tournament_entries').insert({
      tournament_id: tournamentId,
      player1_id: user.id,
      player2_id: player2Id,
      registered_by: user.id,
      status: 'pending',
    })

    if (error) return { error: error.message }
    revalidatePath('/player/tournaments')
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Error al inscribirse' }
  }
}

export async function withdrawMyEntryAction(entryId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data: entry } = await supabase
      .from('tournament_entries')
      .select('player1_id, player2_id, tournament_id, status')
      .eq('id', entryId).single()

    if (!entry) return { error: 'Inscripción no encontrada' }
    if (entry.player1_id !== user.id && entry.player2_id !== user.id) {
      return { error: 'Sin permisos para retirar esta inscripción' }
    }
    if (entry.status === 'eliminated') {
      return { error: 'No puedes retirar una inscripción ya eliminada' }
    }

    const { error } = await supabase
      .from('tournament_entries').update({ status: 'withdrawn' }).eq('id', entryId)

    if (error) return { error: error.message }
    revalidatePath('/player/tournaments')
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Error al retirar inscripción' }
  }
}
