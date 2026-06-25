import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react'
import { getMacrocycleById, changeMacrocycleStatusAction } from '@/actions/training'
import { MesoStatusBadge } from '@/components/training/status-badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { PADEL_LEVEL_LABELS as LEVEL_LABELS } from '@/lib/constants'

export const metadata: Metadata = { title: 'Macrociclo — Entrenador' }

const STATUS_TRANSITIONS: Record<string, { next: string; label: string }> = {
  draft:     { next: 'active',    label: 'Activar' },
  active:    { next: 'completed', label: 'Completar' },
  completed: { next: 'archived',  label: 'Archivar' },
  archived:  { next: 'draft',     label: 'Reactivar como borrador' },
}

function dateLabel(d: string | null): string {
  return d ? formatDate(`${d}T12:00:00`) : '—'
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CoachMacrocycleDetailPage({ params }: PageProps) {
  const { id } = await params
  const macro = await getMacrocycleById(id)
  if (!macro) notFound()

  const transition  = STATUS_TRANSITIONS[macro.status]
  const mesocycles  = macro.mesocycles ?? []

  return (
    <div className="p-4 md:p-8 max-w-4xl space-y-6">
      <Link
        href="/coach/planning"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Planificación
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <MesoStatusBadge status={macro.status} />
            {(macro.start_date || macro.end_date) && (
              <span className="text-xs text-muted-foreground">
                {dateLabel(macro.start_date)} → {dateLabel(macro.end_date)}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold">{macro.name}</h1>
          {macro.general_objective && (
            <p className="text-sm text-muted-foreground">{macro.general_objective}</p>
          )}
        </div>

        {transition && (
          <form action={changeMacrocycleStatusAction}>
            <input type="hidden" name="macrocycleId" value={macro.id} />
            <input type="hidden" name="status" value={transition.next} />
            <Button type="submit" variant="outline" size="sm">{transition.label}</Button>
          </form>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Mesociclos ({mesocycles.length})
        </h2>

        {mesocycles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
            Este macrociclo aún no tiene mesociclos. Vinculá mesociclos desde el detalle de cada uno.
          </div>
        ) : (
          <div className="space-y-2">
            {mesocycles.map((m) => (
              <Link
                key={m.id}
                href={`/coach/planning/${m.id}`}
                className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {LEVEL_LABELS[m.level] ?? m.level} · {m.duration_weeks} semanas
                  </p>
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
    </div>
  )
}
