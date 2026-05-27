import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTournamentById, entryLabel } from '@/actions/tournaments'
import { ConfirmEntryButton, RejectEntryButton } from '@/components/tournaments/entry-actions'
import { TournamentStatusActions, NextRoundButton } from '@/components/tournaments/tournament-status-actions'
import { RecordResultDialog } from '@/components/tournaments/record-result-dialog'
import { VenueForm } from '@/components/tournaments/venue-form'
import { ArrowLeft, Trophy, Calendar, Users, Info, Network, BarChart2, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcCourtCost, recommendedCourts, courtSlotType, durationHours, formatCOP, SLOT_LABELS } from '@/lib/tournaments/costs'

export const metadata: Metadata = { title: 'Torneo — Admin' }

const FORMAT_LABELS: Record<string, string> = {
  eliminatoria: 'Eliminación directa',
  grupos: 'Fase de grupos (round-robin)',
  grupos_y_eliminatoria: 'Grupos + eliminación',
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft:       { label: 'Borrador',           className: 'bg-muted text-muted-foreground' },
  open:        { label: 'Inscripciones abiertas', className: 'bg-emerald-500/15 text-emerald-400' },
  in_progress: { label: 'En curso',           className: 'bg-[#00C4CC]/15 text-[#00C4CC]' },
  completed:   { label: 'Finalizado',         className: 'bg-purple-500/15 text-purple-400' },
  cancelled:   { label: 'Cancelado',          className: 'bg-red-500/15 text-red-400' },
}

const ENTRY_STATUS: Record<string, { label: string; className: string }> = {
  pending:    { label: 'Pendiente',   className: 'bg-amber-500/15 text-amber-400' },
  confirmed:  { label: 'Confirmado',  className: 'bg-emerald-500/15 text-emerald-400' },
  eliminated: { label: 'Eliminado',   className: 'bg-red-500/15 text-red-400' },
  withdrawn:  { label: 'Retirado',    className: 'bg-muted text-muted-foreground' },
}

const MATCH_STATUS: Record<string, { label: string; className: string }> = {
  scheduled:   { label: 'Por jugar',   className: 'bg-amber-500/15 text-amber-400' },
  in_progress: { label: 'En juego',    className: 'bg-[#00C4CC]/15 text-[#00C4CC]' },
  completed:   { label: 'Completado',  className: 'bg-emerald-500/15 text-emerald-400' },
  cancelled:   { label: 'Cancelado',   className: 'bg-muted text-muted-foreground' },
}

const TABS = [
  { key: 'info',          label: 'Información',  icon: Info },
  { key: 'planta',        label: 'Planta Física', icon: Building2 },
  { key: 'inscripciones', label: 'Inscripciones', icon: Users },
  { key: 'llaves',        label: 'Llaves',        icon: Network },
  { key: 'resultados',    label: 'Resultados',    icon: BarChart2 },
]

export default async function AdminTournamentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams
  const activeTab = tab ?? 'info'

  const data = await getTournamentById(id)
  if (!data) notFound()

  const tournament = data as any
  const entries = (tournament.entries ?? []) as any[]
  const matches = (tournament.matches ?? []) as any[]

  const confirmedEntries = entries.filter((e: any) => e.status === 'confirmed')
  const pendingEntries   = entries.filter((e: any) => e.status === 'pending')
  const activeEntries    = entries.filter((e: any) => !['withdrawn'].includes(e.status))

  // Group matches by round
  const rounds = [...new Set(matches.map((m: any) => m.round as string))]
  const matchesByRound = rounds.reduce<Record<string, any[]>>((acc, round) => {
    acc[round] = matches.filter((m: any) => m.round === round)
    return acc
  }, {})

  const lastRound = rounds[rounds.length - 1]
  const lastRoundMatches = matchesByRound[lastRound] ?? []
  const allLastRoundDone = lastRoundMatches.length > 0 && lastRoundMatches.every((m: any) => m.status === 'completed')

  const statusCfg = STATUS_CONFIG[tournament.status] ?? { label: tournament.status, className: 'bg-muted text-muted-foreground' }

  const formatFee = (fee: string | number) => {
    const n = Number(fee)
    if (n === 0) return 'Gratuito'
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <Link
          href="/admin/tournaments"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a torneos
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{tournament.name}</h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {tournament.category} · {FORMAT_LABELS[tournament.format] ?? tournament.format}
            </p>
          </div>

          <TournamentStatusActions
            tournamentId={id}
            status={tournament.status}
            format={tournament.format}
            confirmedCount={confirmedEntries.length}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/admin/tournaments/${id}?tab=${key}`}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {key === 'inscripciones' && pendingEntries.length > 0 && (
              <span className="ml-1 text-[10px] bg-amber-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                {pendingEntries.length}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* ── Tab: Información ───────────────────────────────────────────────── */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inicio</span>
                <span>{new Date(tournament.start_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fin</span>
                <span>{new Date(tournament.end_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Inscripciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confirmadas</span>
                <span className="text-emerald-400 font-semibold">{confirmedEntries.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pendientes</span>
                <span className="text-amber-400">{pendingEntries.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cupo máximo</span>
                <span>{tournament.max_entries ?? 'Sin límite'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inscripción</span>
                <span>{formatFee(tournament.entry_fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modalidad</span>
                <span>{tournament.requires_partner ? 'Por pareja' : 'Individual'}</span>
              </div>
            </CardContent>
          </Card>

          {tournament.description && (
            <Card className="sm:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  Descripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tournament.description}</p>
              </CardContent>
            </Card>
          )}

          <Card className="sm:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Equipos inscritos', value: activeEntries.length },
                { label: 'Confirmados', value: confirmedEntries.length },
                { label: 'Partidos jugados', value: matches.filter((m: any) => m.status === 'completed').length },
                { label: 'Partidos pendientes', value: matches.filter((m: any) => m.status === 'scheduled').length },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-bold text-[#00C4CC]">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Tab: Planta Física ────────────────────────────────────────────── */}
      {activeTab === 'planta' && (
        <div className="space-y-6 max-w-2xl">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Confirmed pairs → recommended courts */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Parejas confirmadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-[#00C4CC]">{confirmedEntries.length}</p>
                {(() => {
                  const rec = recommendedCourts(confirmedEntries.length)
                  return rec ? (
                    <p className="text-[10px] text-muted-foreground mt-0.5">→ {rec} canchas recomendadas</p>
                  ) : confirmedEntries.length > 0 ? (
                    <p className="text-[10px] text-amber-400 mt-0.5">fuera del rango automático</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground mt-0.5">sin inscritos confirmados</p>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Current num_courts */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Canchas configuradas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-400">{tournament.num_courts ?? '—'}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {tournament.start_time ? `${tournament.start_time.slice(0,5)} – ${tournament.end_time?.slice(0,5) ?? '?'}` : 'sin horario'}
                </p>
              </CardContent>
            </Card>

            {/* Court cost total */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Costo total de canchas</CardTitle>
              </CardHeader>
              <CardContent>
                {tournament.court_cost_total ? (
                  <>
                    <p className="text-xl font-bold text-emerald-400">{formatCOP(Number(tournament.court_cost_total))}</p>
                    {confirmedEntries.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatCOP(Math.ceil(Number(tournament.court_cost_total) / confirmedEntries.length))} / pareja
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground/40">—</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Slot breakdown if scheduled */}
          {tournament.tournament_date && tournament.start_time && tournament.end_time && tournament.num_courts && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Detalle de costos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {(() => {
                  const slot  = courtSlotType(tournament.tournament_date, tournament.start_time.slice(0,5))
                  const hours = durationHours(tournament.start_time.slice(0,5), tournament.end_time.slice(0,5))
                  const totalCost = calcCourtCost(
                    tournament.tournament_date,
                    tournament.start_time.slice(0,5),
                    tournament.end_time.slice(0,5),
                    Number(tournament.num_courts),
                  )
                  const perPair = confirmedEntries.length > 0
                    ? Math.ceil(totalCost / confirmedEntries.length) : 0
                  const perEntry = tournament.entry_fee ? Number(tournament.entry_fee) : 0
                  const deficit  = totalCost - (confirmedEntries.length * perEntry)

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-y-2">
                        <span className="text-muted-foreground">Fecha evento</span>
                        <span>{new Date(tournament.tournament_date + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span className="text-muted-foreground">Horario</span>
                        <span>{tournament.start_time.slice(0,5)} – {tournament.end_time.slice(0,5)} ({hours % 1 === 0 ? hours : hours.toFixed(1)} h)</span>
                        <span className="text-muted-foreground">Franja</span>
                        <span>{SLOT_LABELS[slot]}</span>
                        <span className="text-muted-foreground">Canchas</span>
                        <span>{tournament.num_courts}</span>
                        <span className="text-muted-foreground">Costo total</span>
                        <span className="font-semibold text-amber-400">{formatCOP(totalCost)}</span>
                      </div>

                      {confirmedEntries.length > 0 && (
                        <div className={`mt-3 rounded-lg p-3 border text-sm ${
                          deficit <= 0
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                        }`}>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Costo por pareja (recomendado)</span>
                            <span className="font-semibold">{formatCOP(perPair)}</span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-muted-foreground">Inscripción actual</span>
                            <span>{formatCOP(perEntry)}</span>
                          </div>
                          <div className="flex justify-between mt-1 border-t pt-1">
                            <span className="text-muted-foreground">
                              {deficit > 0 ? 'Déficit estimado' : 'Superávit estimado'}
                            </span>
                            <span className={`font-semibold ${deficit > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {deficit > 0 ? '-' : '+'}{formatCOP(Math.abs(deficit))}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {/* Edit form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Editar planta física
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VenueForm
                tournamentId={id}
                confirmedPairs={confirmedEntries.length}
                initial={{
                  tournament_date: tournament.tournament_date ?? null,
                  start_time: tournament.start_time?.slice(0, 5) ?? null,
                  end_time: tournament.end_time?.slice(0, 5) ?? null,
                  num_courts: tournament.num_courts ?? null,
                  court_cost_total: tournament.court_cost_total ?? null,
                }}
              />
            </CardContent>
          </Card>

          {/* Note about financial registration */}
          {tournament.status !== 'in_progress' && tournament.court_cost_total && (
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-4 py-3">
              El egreso de <strong>{formatCOP(Number(tournament.court_cost_total))}</strong> se registrará automáticamente en Finanzas cuando inicies el torneo (cambio a "En curso").
            </p>
          )}
          {tournament.status === 'in_progress' && (
            <p className="text-xs text-emerald-400 bg-emerald-400/10 rounded-lg px-4 py-3">
              El costo de canchas ya fue registrado como egreso en el módulo de Finanzas al iniciar el torneo.
            </p>
          )}
        </div>
      )}

      {/* ── Tab: Inscripciones ─────────────────────────────────────────────── */}
      {activeTab === 'inscripciones' && (
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="border rounded-xl p-10 text-center">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No hay inscripciones aún.</p>
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Equipo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Inscrito</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.map((entry: any) => {
                    const cfg = ENTRY_STATUS[entry.status] ?? { label: entry.status, className: 'bg-muted text-muted-foreground' }
                    const label = `${(entry.player1 as any)?.full_name ?? '—'}${(entry.player2 as any)?.full_name ? ` / ${(entry.player2 as any).full_name}` : ''}`
                    return (
                      <tr key={entry.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">{label}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                          {new Date(entry.registered_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {entry.status === 'pending' && (
                            <div className="flex gap-2">
                              <ConfirmEntryButton entryId={entry.id} />
                              <RejectEntryButton entryId={entry.id} />
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Llaves ────────────────────────────────────────────────────── */}
      {activeTab === 'llaves' && (
        <div className="space-y-6">
          {matches.length === 0 ? (
            <div className="border rounded-xl p-10 text-center">
              <Network className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                {tournament.status === 'open'
                  ? 'Confirma inscripciones y genera el cuadro desde la pestaña Información.'
                  : 'No hay partidos generados aún.'}
              </p>
            </div>
          ) : (
            <>
              {rounds.map((round) => (
                <section key={round} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      {round}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {matchesByRound[round].filter((m: any) => m.status === 'completed').length} / {matchesByRound[round].length} completados
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {matchesByRound[round].map((match: any) => {
                      const e1 = match.entry1
                      const e2 = match.entry2
                      const winner = match.winner_entry_id
                      const mCfg = MATCH_STATUS[match.status] ?? { label: match.status, className: 'bg-muted text-muted-foreground' }
                      const isBye = !e2

                      return (
                        <div
                          key={match.id}
                          className="border rounded-lg p-3 flex items-center gap-3 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                            <div className={`truncate text-sm font-medium ${winner === match.entry1_id ? 'text-emerald-400' : ''}`}>
                              {entryLabel(e1)}
                            </div>
                            <div className="text-center">
                              {match.status === 'completed' ? (
                                <div className="text-xs text-muted-foreground">
                                  <span className={winner === match.entry1_id ? 'font-bold text-foreground' : ''}>{match.score_entry1 ?? '—'}</span>
                                  <span className="mx-1">·</span>
                                  <span className={winner === match.entry2_id ? 'font-bold text-foreground' : ''}>{match.score_entry2 ?? '—'}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">vs</span>
                              )}
                            </div>
                            <div className={`truncate text-sm font-medium text-right ${winner === match.entry2_id ? 'text-emerald-400' : ''}`}>
                              {isBye ? <span className="text-muted-foreground italic">BYE</span> : entryLabel(e2)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${mCfg.className}`}>
                              {isBye ? 'BYE' : mCfg.label}
                            </span>
                            {match.status === 'scheduled' && !isBye && (
                              <RecordResultDialog
                                matchId={match.id}
                                entry1={{ id: match.entry1_id, label: entryLabel(e1) }}
                                entry2={{ id: match.entry2_id, label: entryLabel(e2) }}
                              />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}

              {/* Next round button */}
              {tournament.status === 'in_progress' && tournament.format !== 'grupos' && allLastRoundDone && (
                <div className="pt-2">
                  <NextRoundButton tournamentId={id} currentRound={lastRound} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Tab: Resultados ────────────────────────────────────────────────── */}
      {activeTab === 'resultados' && (
        <div className="space-y-4">
          {matches.filter((m: any) => m.status === 'completed').length === 0 ? (
            <div className="border rounded-xl p-10 text-center">
              <BarChart2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No hay resultados registrados aún.</p>
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ronda</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Equipo 1</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Resultado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Equipo 2</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Ganador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {matches
                    .filter((m: any) => m.status === 'completed' && m.score_entry1 !== 'BYE')
                    .map((match: any) => {
                      const e1 = match.entry1
                      const e2 = match.entry2
                      const winner = match.winner_entry_id
                      const winnerEntry = winner === match.entry1_id ? e1 : e2
                      return (
                        <tr key={match.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3 text-xs text-muted-foreground">{match.round}</td>
                          <td className={`px-4 py-3 font-medium ${winner === match.entry1_id ? 'text-emerald-400' : ''}`}>
                            {entryLabel(e1)}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                            {match.score_entry1} · {match.score_entry2}
                          </td>
                          <td className={`px-4 py-3 font-medium ${winner === match.entry2_id ? 'text-emerald-400' : ''}`}>
                            {entryLabel(e2)}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                              {entryLabel(winnerEntry)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
