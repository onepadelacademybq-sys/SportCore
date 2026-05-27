'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TournamentStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled'
export type TournamentFormat = 'eliminatoria' | 'grupos' | 'grupos_y_eliminatoria'
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

export async function getTournaments(): Promise<Tournament[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      id, name, format, category, start_date, end_date, status,
      max_entries, entry_fee, requires_partner, description, created_at,
      entries:tournament_entries(id, status)
    `)
    .order('start_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as Tournament[]
}

export async function getOpenTournaments(): Promise<Tournament[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      id, name, format, category, start_date, end_date, status,
      max_entries, entry_fee, requires_partner, description, created_at,
      entries:tournament_entries(id, status)
    `)
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
      id, name, format, category, start_date, end_date, status,
      max_entries, entry_fee, requires_partner, description, created_at,
      entries:tournament_entries(
        id, status, registered_at, player1_id, player2_id, registered_by,
        player1:profiles!player1_id(full_name),
        player2:profiles!player2_id(full_name)
      ),
      matches:tournament_matches(
        id, round, scheduled_at, score_entry1, score_entry2,
        winner_entry_id, status, entry1_id, entry2_id, court_id,
        entry1:tournament_entries!entry1_id(
          id, player1_id, player2_id,
          player1:profiles!player1_id(full_name),
          player2:profiles!player2_id(full_name)
        ),
        entry2:tournament_entries!entry2_id(
          id, player1_id, player2_id,
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

    if (!name || !format || !category || !start_date || !end_date) {
      return { error: 'Completa todos los campos requeridos' }
    }
    if (new Date(end_date) < new Date(start_date)) {
      return { error: 'La fecha de fin no puede ser anterior a la de inicio' }
    }

    const { error } = await supabase.from('tournaments').insert({
      name, format, category, start_date, end_date,
      max_entries, entry_fee, description, requires_partner,
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
    const { supabase } = await requireAdmin()
    const { error } = await supabase.from('tournaments').update({ status }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/tournaments')
    revalidatePath(`/admin/tournaments/${id}`)
    revalidatePath('/player/tournaments')
    revalidatePath('/coach/tournaments')
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Error actualizando estado' }
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

// ─── Admin: Bracket Generation ────────────────────────────────────────────────

export async function generateMatchesAction(tournamentId: string) {
  try {
    const { supabase } = await requireAdmin()

    const { data: tournament } = await supabase
      .from('tournaments').select('format, status').eq('id', tournamentId).single()

    if (!tournament) return { error: 'Torneo no encontrado' }
    if (!['open', 'in_progress'].includes(tournament.status as string)) {
      return { error: 'El torneo debe estar abierto o en progreso para generar llaves' }
    }

    const { data: entries } = await supabase
      .from('tournament_entries').select('id')
      .eq('tournament_id', tournamentId).eq('status', 'confirmed')

    if (!entries || entries.length < 2) {
      return { error: 'Se necesitan al menos 2 inscripciones confirmadas' }
    }

    // Remove existing scheduled matches only (keep completed ones)
    await supabase
      .from('tournament_matches').delete()
      .eq('tournament_id', tournamentId).eq('status', 'scheduled')

    const rows: Record<string, unknown>[] = []

    if (tournament.format === 'grupos') {
      // Round-robin: every entry plays every other
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
    } else {
      // eliminatoria (and grupos_y_eliminatoria first round)
      const shuffled = [...entries].sort(() => Math.random() - 0.5)
      const n = shuffled.length
      const totalRounds = Math.ceil(Math.log2(n))

      const roundName = totalRounds <= 1 ? 'Final'
        : totalRounds === 2 ? 'Semifinal'
        : totalRounds === 3 ? 'Cuartos de final'
        : totalRounds === 4 ? 'Octavos de final'
        : 'Ronda 1'

      for (let i = 0; i < shuffled.length - 1; i += 2) {
        rows.push({
          tournament_id: tournamentId,
          entry1_id: shuffled[i].id,
          entry2_id: shuffled[i + 1].id,
          round: roundName,
          status: 'scheduled',
        })
      }

      // Odd entry gets a bye (auto-advance)
      if (shuffled.length % 2 !== 0) {
        rows.push({
          tournament_id: tournamentId,
          entry1_id: shuffled[shuffled.length - 1].id,
          entry2_id: null,
          round: roundName,
          status: 'completed',
          winner_entry_id: shuffled[shuffled.length - 1].id,
          score_entry1: 'BYE',
          score_entry2: null,
        })
      }
    }

    if (rows.length > 0) {
      const { error } = await supabase.from('tournament_matches').insert(rows)
      if (error) return { error: error.message }
    }

    await supabase
      .from('tournaments').update({ status: 'in_progress' }).eq('id', tournamentId)

    revalidatePath(`/admin/tournaments/${tournamentId}`)
    revalidatePath('/admin/tournaments')
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Error generando el cuadro' }
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

    // Mark losing entry as eliminated
    const loserEntryId = winnerEntryId === match.entry1_id ? match.entry2_id : match.entry1_id
    if (loserEntryId) {
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
