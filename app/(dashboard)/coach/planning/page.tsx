import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, UserCircle2, ChevronRight, Calendar } from 'lucide-react'
import { getAssignmentTargets } from '@/actions/training'

export const metadata: Metadata = { title: 'Planificación — Entrenador' }

const LEVEL_LABELS: Record<string, string> = {
  '5ta_masculino': '5ta Masc.', '6ta_masculino': '6ta Masc.', '7ma_masculino': '7ma Masc.',
  femenino_d: 'Fem. D', femenino_c: 'Fem. C',
  juvenil_s18: 'S18', juvenil_s16: 'S16', juvenil_s14: 'S14',
  prejuvenil: 'Prejuv.', baby_padel: 'Baby',
}

export default async function CoachPlanningPage() {
  const { players, groups } = await getAssignmentTargets()

  const hasContent = players.length > 0 || groups.length > 0

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Planificación</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Seleccioná un jugador o grupo para gestionar su planificación de entrenamiento.
        </p>
      </div>

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
