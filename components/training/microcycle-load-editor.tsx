import type { Microcycle } from '@/actions/training'
import { updateMicrocycleLoadAction } from '@/actions/training'
import { CONTENT_PHASES } from '@/lib/planning/load-phases'
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
        <label className="text-xs text-muted-foreground">Volumen (0–100)</label>
        <input name="plannedVolume" type="number" min={0} max={100} defaultValue={microcycle.planned_volume ?? ''} className={`${fieldClass} w-24`} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Intensidad (0–100)</label>
        <input name="plannedIntensity" type="number" min={0} max={100} defaultValue={microcycle.planned_intensity ?? ''} className={`${fieldClass} w-24`} />
      </div>

      <Button type="submit" variant="outline" size="sm">Guardar carga</Button>
    </form>
  )
}
