import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOpenTournaments, getMyTournamentEntries, entryLabel } from '@/actions/tournaments'
import { RegisterForm } from '@/components/tournaments/register-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Calendar, Users, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Torneos — Jugador' }

const FORMAT_LABELS: Record<string, string> = {
  eliminatoria: 'Eliminación directa',
  grupos: 'Fase de grupos',
  grupos_y_eliminatoria: 'Grupos + eliminación',
}

const TOURNAMENT_STATUS: Record<string, { label: string; className: string }> = {
  open:        { label: 'Inscripciones abiertas', className: 'bg-emerald-500/15 text-emerald-400' },
  in_progress: { label: 'En curso',    className: 'bg-[#00C4CC]/15 text-[#00C4CC]' },
  completed:   { label: 'Finalizado',  className: 'bg-purple-500/15 text-purple-400' },
}

const ENTRY_STATUS: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pending:    { label: 'Pendiente de confirmación', className: 'text-amber-400',            icon: Clock },
  confirmed:  { label: 'Inscripción confirmada',    className: 'text-emerald-400',          icon: CheckCircle },
  eliminated: { label: 'Eliminado',                 className: 'text-muted-foreground',     icon: XCircle },
  withdrawn:  { label: 'Retirado',                  className: 'text-muted-foreground',     icon: XCircle },
}

export default async function PlayerTournamentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const playerId = user.id

  const [tournaments, myEntries, { data: players }] = await Promise.all([
    getOpenTournaments(),
    getMyTournamentEntries(playerId),
    supabase.from('profiles').select('id, full_name').eq('role', 'player').eq('is_active', true).order('full_name'),
  ])

  const myTournamentIds = new Set(
    myEntries
      .filter(e => !['withdrawn'].includes(e.status))
      .map(e => e.tournament_id)
  )

  const openTournaments = tournaments.filter(t => t.status === 'open')
  const activeTournaments = tournaments.filter(t => t.status === 'in_progress')
  const pastTournaments = tournaments.filter(t => t.status === 'completed')

  const formatFee = (fee: string | number) => {
    const n = Number(fee)
    if (n === 0) return 'Gratis'
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
  }

  const playerList = (players ?? []) as Array<{ id: string; full_name: string }>

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-400" />
          Torneos
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Torneos activos y tu historial de participación</p>
      </div>

      {/* My entries */}
      {myEntries.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Mis inscripciones
          </h2>
          <div className="grid gap-3">
            {myEntries.map((entry) => {
              const t = entry.tournament as any
              const cfg = ENTRY_STATUS[entry.status] ?? { label: entry.status, className: 'text-muted-foreground', icon: AlertCircle }
              const Icon = cfg.icon
              const partner = entry.player1_id === playerId ? entry.player2 : entry.player1
              return (
                <Card key={entry.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{t?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t?.category} ·{' '}
                        {t?.start_date && new Date(t.start_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {(partner as any)?.full_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Pareja: {(partner as any).full_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Icon className={`h-3.5 w-3.5 ${cfg.className}`} />
                      <span className={`text-xs font-medium ${cfg.className}`}>{cfg.label}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* Open tournaments */}
      {openTournaments.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Inscripciones abiertas
          </h2>
          <div className="grid gap-4">
            {openTournaments.map((t) => {
              const entries = (t.entries ?? []) as Array<{ id: string; status: string }>
              const confirmedCount = entries.filter(e => e.status === 'confirmed').length
              const totalActive    = entries.filter(e => e.status !== 'withdrawn').length
              const alreadyIn      = myTournamentIds.has(t.id)
              const isFull         = t.max_entries !== null && totalActive >= t.max_entries

              return (
                <Card key={t.id} className="border-emerald-400/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <CardTitle className="text-base">{t.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">{t.category}</p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                        Inscripciones abiertas
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(t.start_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        {' – '}
                        {new Date(t.end_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {confirmedCount} inscritos{t.max_entries ? ` / ${t.max_entries}` : ''}
                      </div>
                      <div className="text-muted-foreground">
                        {FORMAT_LABELS[t.format] ?? t.format}
                      </div>
                      <div className="font-medium">
                        {formatFee(t.entry_fee)}
                      </div>
                    </div>

                    {t.description && (
                      <p className="text-sm text-muted-foreground">{t.description}</p>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                      {alreadyIn ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          Ya estás inscrito
                        </div>
                      ) : isFull ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                          <AlertCircle className="h-4 w-4" />
                          Torneo lleno
                        </div>
                      ) : (
                        <RegisterForm
                          tournamentId={t.id}
                          requiresPartner={t.requires_partner}
                          players={playerList}
                          currentPlayerId={playerId}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* In-progress tournaments */}
      {activeTournaments.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            En curso
          </h2>
          <div className="grid gap-3">
            {activeTournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        </section>
      )}

      {/* Past tournaments */}
      {pastTournaments.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Finalizados
          </h2>
          <div className="grid gap-3">
            {pastTournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        </section>
      )}

      {tournaments.length === 0 && myEntries.length === 0 && (
        <div className="border rounded-xl p-12 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No hay torneos disponibles actualmente.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Vuelve más tarde o contacta al administrador.</p>
        </div>
      )}
    </div>
  )
}

function TournamentCard({ tournament: t }: { tournament: Awaited<ReturnType<typeof getOpenTournaments>>[number] }) {
  const entries = (t.entries ?? []) as Array<{ id: string; status: string }>
  const confirmedCount = entries.filter(e => e.status === 'confirmed').length
  const cfg = TOURNAMENT_STATUS[t.status] ?? { label: t.status, className: 'bg-muted text-muted-foreground' }

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm">{t.name}</p>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.category} · {FORMAT_LABELS[t.format] ?? t.format}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(t.start_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
              {' – '}
              {new Date(t.end_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: '2-digit' })}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {confirmedCount} equipos
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
