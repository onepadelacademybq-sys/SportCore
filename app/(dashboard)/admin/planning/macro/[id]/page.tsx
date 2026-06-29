import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ChevronRight, Layers, Pencil } from 'lucide-react'
import { getMacrocycleById, changeMacrocycleStatusAction, generateMesocyclesAction, getObjectives } from '@/actions/training'
import { MesoStatusBadge } from '@/components/training/status-badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { PADEL_LEVEL_LABELS as LEVEL_LABELS } from '@/lib/constants'
import { ATHLETE_LEVEL_LABELS, COMPETITION_TYPE_LABELS, PERIODIZATION_MODEL_LABELS, QUALITY_LABELS } from '@/lib/planning/diagnostic'
import { LoadMap } from '@/components/training/load-map'
import { MesocycleObjectiveForm } from '@/components/training/mesocycle-objective-form'
import { MesocycleConfigForm } from '@/components/training/mesocycle-config-form'

export const metadata: Metadata = { title: 'Macrociclo — Admin' }

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

export default async function AdminMacrocycleDetailPage({ params }: PageProps) {
  const { id } = await params
  const [macro, objectives] = await Promise.all([getMacrocycleById(id), getObjectives()])
  if (!macro) notFound()

  const transition  = STATUS_TRANSITIONS[macro.status]
  const mesocycles  = macro.mesocycles ?? []
  const loadWeeks   = mesocycles.flatMap((m) => [...(m.microcycles ?? [])].sort((a, b) => a.week_number - b.week_number))

  return (
    <div className="p-4 md:p-8 max-w-4xl space-y-6">
      <Link
        href="/admin/planning"
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

        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/admin/planning/macro/${macro.id}/edit`}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Link>
          {transition && (
            <form action={changeMacrocycleStatusAction}>
              <input type="hidden" name="macrocycleId" value={macro.id} />
              <input type="hidden" name="status" value={transition.next} />
              <Button type="submit" variant="outline" size="sm">{transition.label}</Button>
            </form>
          )}
        </div>
      </div>

      {/* Diagnóstico */}
      {(macro.athlete_level || macro.competition_type || macro.periodization_model || macro.qualities.length > 0) && (
        <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Nivel</p>
            <p className="font-medium">{macro.athlete_level ? ATHLETE_LEVEL_LABELS[macro.athlete_level] : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Competición</p>
            <p className="font-medium">{macro.competition_type ? COMPETITION_TYPE_LABELS[macro.competition_type] : '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">Modelo de periodización</p>
            <p className="font-medium">{macro.periodization_model ? PERIODIZATION_MODEL_LABELS[macro.periodization_model] : '—'}</p>
          </div>
          {macro.qualities.length > 0 && (
            <div className="col-span-2 sm:col-span-4">
              <p className="text-xs text-muted-foreground mb-1">Cualidades</p>
              <div className="flex flex-wrap gap-1.5">
                {macro.qualities.map((q) => (
                  <span key={q} className="px-2 py-0.5 rounded-full border border-border bg-muted text-xs">
                    {QUALITY_LABELS[q] ?? q}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {loadWeeks.length > 0 && <LoadMap microcycles={loadWeeks} />}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Mesociclos ({mesocycles.length})
        </h2>

        {mesocycles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-5 py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Este plan aún no tiene mesociclos.</p>
            <form action={generateMesocyclesAction}>
              <input type="hidden" name="macrocycleId" value={macro.id} />
              <Button type="submit" variant="outline" size="sm">Generar 12 mesociclos</Button>
            </form>
          </div>
        ) : (
          <div className="space-y-3">
            {mesocycles.map((m) => (
              <div key={m.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/admin/planning/${m.id}`} className="min-w-0 group">
                    <p className="font-medium truncate group-hover:text-primary transition-colors">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.level ? `${LEVEL_LABELS[m.level] ?? m.level} · ` : ''}{m.duration_weeks} semanas
                    </p>
                  </Link>
                  <div className="flex items-center gap-3 shrink-0">
                    <MesoStatusBadge status={m.status} />
                    <Link href={`/admin/planning/${m.id}`} className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">
                      Configurar semanas <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
                <MesocycleObjectiveForm mesocycleId={m.id} objectives={objectives} currentObjectiveId={m.objective_id ?? null} />
                <MesocycleConfigForm mesocycle={m} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
