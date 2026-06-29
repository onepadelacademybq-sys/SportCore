import type { Microcycle } from '@/actions/training'
import { updateMicrocycleLoadAction } from '@/actions/training'
import { CONTENT_PHASES, INTENSITY_SCALE } from '@/lib/planning/load-phases'
import { Button } from '@/components/ui/button'

const fieldClass =
  'rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

export function MicrocycleLoadEditor({ microcycle }: { microcycle: Microcycle }) {
  return (
    <form action={updateMicrocycleLoadAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="microcycleId" value={microcycle.id} />

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Fase</label>
        <select name="contentPhase" defaultValue={microcycle.content_phase ?? ''} className={fieldClass}>
          <option value="">—</option>
          {CONTENT_PHASES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Intensidad (1–5)</label>
        <select name="plannedIntensity" defaultValue={microcycle.planned_intensity ?? ''} className={`${fieldClass} min-w-64`}>
          <option value="">—</option>
          {INTENSITY_SCALE.map((i) => (
            <option key={i.value} value={i.value}>{i.value} · {i.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 pb-1.5">
        <span className="text-xs text-muted-foreground">Volumen</span>
        <span className="text-sm">
          {microcycle.planned_volume != null ? `${microcycle.planned_volume} min/sem` : '— (definí la config)'}
        </span>
      </div>

      <Button type="submit" variant="outline" size="sm">Guardar carga</Button>
    </form>
  )
}
