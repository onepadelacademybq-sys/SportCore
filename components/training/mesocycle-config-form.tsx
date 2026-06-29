import { updateMesocycleConfigAction } from '@/actions/training'
import { Button } from '@/components/ui/button'

const fieldClass =
  'rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

interface Props {
  mesocycle: {
    id: string
    sessions_per_week?: number | null
    hours_per_session?: number | null
    suspended?: boolean
  }
}

export function MesocycleConfigForm({ mesocycle }: Props) {
  return (
    <form action={updateMesocycleConfigAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="mesocycleId" value={mesocycle.id} />

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Sesiones/semana</label>
        <input name="sessionsPerWeek" type="number" min={0} max={7} defaultValue={mesocycle.sessions_per_week ?? ''} className={`${fieldClass} w-28`} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Horas/sesión</label>
        <input name="hoursPerSession" type="number" min={0} max={8} step={0.5} defaultValue={mesocycle.hours_per_session ?? ''} className={`${fieldClass} w-28`} />
      </div>

      <label className="flex items-center gap-2 text-sm pb-1.5">
        <input type="checkbox" name="suspended" defaultChecked={mesocycle.suspended ?? false} className="h-4 w-4" />
        Suspendido
      </label>

      <Button type="submit" variant="outline" size="sm">Guardar config</Button>
    </form>
  )
}
