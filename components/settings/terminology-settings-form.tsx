'use client'

import { useActionState } from 'react'
import { updateTerminologyAction, type SettingsState, type AcademySettingsData } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const initial: SettingsState = { error: null }

const SPORT_DEFAULTS: Record<string, { resource: string; coach: string; player: string }> = {
  padel:      { resource: 'Cancha',   coach: 'Entrenador', player: 'Jugador' },
  tenis:      { resource: 'Cancha',   coach: 'Profesor',   player: 'Alumno' },
  futbol:     { resource: 'Campo',    coach: 'Técnico',    player: 'Jugador' },
  natacion:   { resource: 'Carril',   coach: 'Entrenador', player: 'Nadador' },
  baloncesto: { resource: 'Cancha',   coach: 'Entrenador', player: 'Jugador' },
}

export function TerminologySettingsForm({ data }: { data: AcademySettingsData }) {
  const [state, action, pending] = useActionState(updateTerminologyAction, initial)
  const defaults = SPORT_DEFAULTS[data.sport] ?? { resource: 'Espacio', coach: 'Entrenador', player: 'Jugador' }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Terminología</CardTitle>
        <CardDescription>
          Personaliza los nombres que usan tus miembros. Se aplican en toda la plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resource">Espacio reservable</Label>
              <Input
                id="resource"
                name="resource"
                defaultValue={data.terminology.resource}
                placeholder={defaults.resource}
              />
              <p className="text-xs text-muted-foreground">Ej: Cancha, Campo, Carril, Pista</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach">Entrenador</Label>
              <Input
                id="coach"
                name="coach"
                defaultValue={data.terminology.coach}
                placeholder={defaults.coach}
              />
              <p className="text-xs text-muted-foreground">Ej: Entrenador, Profesor, Técnico</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="player">Deportista</Label>
              <Input
                id="player"
                name="player"
                defaultValue={data.terminology.player}
                placeholder={defaults.player}
              />
              <p className="text-xs text-muted-foreground">Ej: Jugador, Alumno, Nadador</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Deporte: <span className="capitalize font-medium">{data.sport}</span>
            </p>
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
