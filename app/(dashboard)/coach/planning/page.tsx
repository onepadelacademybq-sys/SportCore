import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, UserCircle2, ChevronRight, Calendar, Layers, Plus } from 'lucide-react'
import { getAssignmentTargets, getMacrocycles } from '@/actions/training'
import { MesoStatusBadge } from '@/components/training/status-badge'
import { PADEL_LEVEL_LABELS_SHORT as LEVEL_LABELS } from '@/lib/constants'

export const metadata: Metadata = { title: 'Planificación — Entrenador' }

const newBtn = 'inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors'

export default async function CoachPlanningPage() {
  const [{ players, groups }, macrocycles] = await Promise.all([
    getAssignmentTargets(),
    getMacrocycles(),
  ])

  const hasContent = players.length > 0 || groups.length > 0

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Planificación</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Seleccioná un jugador o grupo para gestionar su planificación de entrenamiento.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Macrociclos ({macrocycles.length})
          </h2>
          <Link href="/coach/planning/macro/new" className={newBtn}>
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        </div>
        {macrocycles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {macrocycles.map((m) => (
              <Link
                key={m.id}
                href={`/coach/planning/macro/${m.id}`}
                className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.mesocycle_count} mesociclo{m.mesocycle_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <MesoStatusBadge status={m.status} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {!hasContent ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No hay jugadores ni grupos activos.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Users className="h-4 w-4" />
                Grupos ({groups.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groups.map((g) => (
                  <Link
                    key={g.id}
                    href={`/coach/planning/group/${g.id}`}
                    className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{g.name}</p>
                        <p className="text-xs text-muted-foreground">{LEVEL_LABELS[g.level] ?? g.level}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {players.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <UserCircle2 className="h-4 w-4" />
                Jugadores ({players.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {players.map((p) => (
                  <Link
                    key={p.id}
                    href={`/coach/planning/player/${p.id}`}
                    className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-semibold text-foreground/60">
                        {p.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
