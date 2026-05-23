import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Calendar, Users, ChevronRight } from 'lucide-react'
import { getMesocycles } from '@/actions/training'
import { MesoStatusBadge } from '@/components/training/status-badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Planificación — Admin' }

const LEVEL_LABELS: Record<string, string> = {
  '5ta_masculino': '5ta Masc.', '6ta_masculino': '6ta Masc.', '7ma_masculino': '7ma Masc.',
  femenino_d: 'Fem. D', femenino_c: 'Fem. C',
  juvenil_s18: 'S18', juvenil_s16: 'S16', juvenil_s14: 'S14',
  prejuvenil: 'Prejuv.', baby_padel: 'Baby',
}

export default async function AdminPlanningPage() {
  const mesocycles = await getMesocycles()

  const byStatus = {
    active:    mesocycles.filter((m) => m.status === 'active'),
    draft:     mesocycles.filter((m) => m.status === 'draft'),
    completed: mesocycles.filter((m) => m.status === 'completed'),
    archived:  mesocycles.filter((m) => m.status === 'archived'),
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Planificación</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Mesociclos, microciclos y sesiones de entrenamiento
          </p>
        </div>
        <Link href="/admin/planning/new">
          <Button className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Nuevo mesociclo
          </Button>
        </Link>
      </div>

      {mesocycles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No hay mesociclos creados aún.</p>
          <Link href="/admin/planning/new" className="mt-4">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Crear el primero
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {(['active', 'draft', 'completed', 'archived'] as const).map((status) => {
            const items = byStatus[status]
            if (items.length === 0) return null
            return (
              <section key={status}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  <MesoStatusBadge status={status} />
                  <span className="ml-2">{items.length}</span>
                </h2>
                <div className="space-y-2">
                  {items.map((m) => (
                    <Link
                      key={m.id}
                      href={`/admin/planning/${m.id}`}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-semibold truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{m.general_objective}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{LEVEL_LABELS[m.level] ?? m.level}</span>
                          <span>·</span>
                          <span>{m.duration_weeks} semanas</span>
                          {m.assignments.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {m.assignments.length} asignación{m.assignments.length !== 1 ? 'es' : ''}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
