import type { Metadata } from 'next'
import Link from 'next/link'
import { getTournaments } from '@/actions/tournaments'
import { CreateTournamentDialog } from '@/components/tournaments/create-tournament-dialog'
import { Trophy, Calendar, Users } from 'lucide-react'

export const metadata: Metadata = { title: 'Torneos — Admin' }

const FORMAT_LABELS: Record<string, string> = {
  eliminatoria: 'Eliminación directa',
  grupos: 'Fase de grupos',
  grupos_y_eliminatoria: 'Grupos + eliminación',
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft:       { label: 'Borrador',    className: 'bg-muted text-muted-foreground' },
  open:        { label: 'Inscripciones abiertas', className: 'bg-emerald-500/15 text-emerald-400' },
  in_progress: { label: 'En curso',    className: 'bg-[#00C4CC]/15 text-[#00C4CC]' },
  completed:   { label: 'Finalizado',  className: 'bg-purple-500/15 text-purple-400' },
  cancelled:   { label: 'Cancelado',   className: 'bg-red-500/15 text-red-400' },
}

export default async function AdminTournamentsPage() {
  const tournaments = await getTournaments()

  const byStatus = {
    active: tournaments.filter(t => ['open', 'in_progress'].includes(t.status)),
    draft: tournaments.filter(t => t.status === 'draft'),
    past: tournaments.filter(t => ['completed', 'cancelled'].includes(t.status)),
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" />
            Torneos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {tournaments.length} torneo{tournaments.length !== 1 ? 's' : ''} registrado{tournaments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <CreateTournamentDialog />
      </div>

      {tournaments.length === 0 ? (
        <div className="border rounded-xl p-12 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No hay torneos registrados.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Crea el primero con el botón superior.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active */}
          {byStatus.active.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Activos
              </h2>
              <TournamentTable tournaments={byStatus.active} />
            </section>
          )}

          {/* Draft */}
          {byStatus.draft.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Borradores
              </h2>
              <TournamentTable tournaments={byStatus.draft} />
            </section>
          )}

          {/* Past */}
          {byStatus.past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Historial
              </h2>
              <TournamentTable tournaments={byStatus.past} />
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function TournamentTable({ tournaments }: { tournaments: Awaited<ReturnType<typeof getTournaments>> }) {
  return (
    <div className="border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Categoría</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Formato</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Fechas</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Equipos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tournaments.map((t) => {
            const cfg = STATUS_CONFIG[t.status] ?? { label: t.status, className: 'bg-muted text-muted-foreground' }
            const entries = (t.entries ?? []) as Array<{ id: string; status: string }>
            const confirmed = entries.filter(e => e.status === 'confirmed').length
            const total = entries.filter(e => e.status !== 'withdrawn').length
            const startDate = new Date(t.start_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
            const endDate   = new Date(t.end_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: '2-digit' })

            return (
              <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/tournaments/${t.id}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {t.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.category}</td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                  {FORMAT_LABELS[t.format] ?? t.format}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {startDate} – {endDate}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
                    {cfg.label}
                  </span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>
                      {confirmed} conf.
                      {t.max_entries ? ` / ${t.max_entries}` : ` (${total} total)`}
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
