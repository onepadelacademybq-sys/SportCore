import type { Metadata } from 'next'
import { getOpenTournaments } from '@/actions/tournaments'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Calendar, Users } from 'lucide-react'

export const metadata: Metadata = { title: 'Torneos — Entrenador' }

const FORMAT_LABELS: Record<string, string> = {
  eliminatoria: 'Eliminación directa',
  grupos: 'Fase de grupos',
  grupos_y_eliminatoria: 'Grupos + eliminación',
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open:        { label: 'Inscripciones abiertas', className: 'bg-emerald-500/15 text-emerald-400' },
  in_progress: { label: 'En curso',               className: 'bg-brand/15 text-brand' },
  completed:   { label: 'Finalizado',             className: 'bg-purple-500/15 text-purple-400' },
}

export default async function CoachTournamentsPage() {
  const tournaments = await getOpenTournaments()

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-400" />
          Torneos
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Torneos activos y finalizados de la academia
        </p>
      </div>

      {tournaments.length === 0 ? (
        <div className="border rounded-xl p-12 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No hay torneos activos actualmente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => {
            const entries = (t.entries ?? []) as Array<{ id: string; status: string }>
            const confirmed = entries.filter(e => e.status === 'confirmed').length
            const cfg = STATUS_CONFIG[t.status] ?? { label: t.status, className: 'bg-muted text-muted-foreground' }

            return (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{t.name}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.category} · {FORMAT_LABELS[t.format] ?? t.format}
                      </p>
                      {t.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(t.start_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
                          {' – '}
                          {new Date(t.end_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'UTC' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {confirmed} confirmados{t.max_entries ? ` / ${t.max_entries}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
