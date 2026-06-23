'use client'

import { useActionState } from 'react'
import { updateScheduleSettingsAction, type SettingsState, type AcademySettingsData } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const initial: SettingsState = { error: null }

export function ScheduleSettingsForm({ data }: { data: AcademySettingsData }) {
  const [state, action, pending] = useActionState(updateScheduleSettingsAction, initial)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horarios y reglas de reserva</CardTitle>
        <CardDescription>
          Controla cuándo está abierta la academia y las políticas de reserva.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-6">

          <div className="space-y-3">
            <p className="text-sm font-medium">Horario de funcionamiento</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openingTime">Apertura</Label>
                <Input id="openingTime" name="openingTime" type="time" defaultValue={data.openingTime} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingTime">Cierre</Label>
                <Input id="closingTime" name="closingTime" type="time" defaultValue={data.closingTime} required />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Reglas de reserva</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minBookingAdvanceHours">
                  Anticipación mínima
                  <span className="ml-1 text-xs text-muted-foreground">(horas)</span>
                </Label>
                <Input
                  id="minBookingAdvanceHours"
                  name="minBookingAdvanceHours"
                  type="number"
                  min={0} max={168}
                  defaultValue={data.minBookingAdvanceHours}
                />
                <p className="text-xs text-muted-foreground">Con cuánta anticipación puede reservar un jugador.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxBookingAdvanceDays">
                  Anticipación máxima
                  <span className="ml-1 text-xs text-muted-foreground">(días)</span>
                </Label>
                <Input
                  id="maxBookingAdvanceDays"
                  name="maxBookingAdvanceDays"
                  type="number"
                  min={1} max={365}
                  defaultValue={data.maxBookingAdvanceDays}
                />
                <p className="text-xs text-muted-foreground">Máximo con cuántos días de antelación se puede reservar.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cancellationDeadlineHours">
                  Plazo de cancelación
                  <span className="ml-1 text-xs text-muted-foreground">(horas antes)</span>
                </Label>
                <Input
                  id="cancellationDeadlineHours"
                  name="cancellationDeadlineHours"
                  type="number"
                  min={0} max={168}
                  defaultValue={data.cancellationDeadlineHours}
                />
                <p className="text-xs text-muted-foreground">Hasta cuántas horas antes se puede cancelar sin penalización.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div />
            <div className="flex items-center gap-4">
              {state.error && (
                <Alert variant="destructive" className="py-2 px-3">
                  <AlertDescription className="text-xs">{state.error}</AlertDescription>
                </Alert>
              )}
              {state.success && (
                <p className="text-xs text-emerald-400">{state.success}</p>
              )}
              <Button type="submit" disabled={pending} size="sm">
                {pending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
