import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Plus, ChevronRight, UserCircle2 } from 'lucide-react'
import { getMesocyclesByPlayer, getAssignmentTargets } from '@/actions/training'
import { MesoStatusBadge } from '@/components/training/status-badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Planificación Jugador — Admin' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminPlayerPlanningPage({ params }: PageProps) {
  const { id: playerId } = await params

  const [mesocycles, targets] = await Promise.all([
    getMesocyclesByPlayer(playerId),
    getAssignmentTargets(),
  ])

  const player = targets.players.find((p) => p.id === playerId)
  if (!player) notFound()

  const byStatus = {
    active:    mesocycles.filter((m) => m.status === 'active'),
    draft:     mesocycles.filter((m) => m.status === 'draft'),
    completed: mesocycles.filter((m) => m.status === 'completed'),
    archived:  mesocycles.filter((m) => m.status === 'archived'),
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <Link
        href="/admin/planning"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Planificación
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold text-foreground/60">
            {player.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{player.full_name}</h1>
            <p className="text-sm text-muted-foreground">{player.email}</p>
          </div>
        </div>
        <Link href={`/admin/planning/new?playerId=${playerId}`}>
          <Button className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Nuevo mesociclo
          </Button>
        </Link>
      </div>

      {mesocycles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xl">
          <UserCircle2 className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No hay mesociclos asignados a este jugador.</p>
          <Link href={`/admin/planning/new?playerId=${playerId}`} className="mt-4">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Crear primero
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
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <MesoStatusBadge status={status} />
                  <span>{items.length}</span>
                </h2>
                <div className="space-y-2">
                  {items.map((m) => {
                    const total = m.microcycles.flatMap((mc) => mc.sessions).length
                    const done  = m.microcycles.flatMap((mc) => mc.sessions).filter((s) => s.status === 'completed').length
                    return (
                      <Link
                        key={m.id}
                        href={`/admin/planning/${m.id}`}
                        className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-semibold truncate">{m.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{m.general_objective}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {m.duration_weeks} semanas · {done}/{total} sesiones completadas
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
