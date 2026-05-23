'use client'

import { useActionState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { TrainingState } from '@/actions/training'

const selectClass =
  'w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground ' +
  'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

const LEVELS = [
  { value: '5ta_masculino', label: '5ta Masculino' },
  { value: '6ta_masculino', label: '6ta Masculino' },
  { value: '7ma_masculino', label: '7ma Masculino' },
  { value: 'femenino_d',    label: 'Femenino D' },
  { value: 'femenino_c',    label: 'Femenino C' },
  { value: 'juvenil_s18',   label: 'Juvenil S18' },
  { value: 'juvenil_s16',   label: 'Juvenil S16' },
  { value: 'juvenil_s14',   label: 'Juvenil S14' },
  { value: 'prejuvenil',    label: 'Prejuvenil' },
  { value: 'baby_padel',    label: 'Baby Pádel' },
]

type FormAction = (prev: TrainingState, formData: FormData) => Promise<TrainingState>

interface Props {
  action: FormAction
  defaultValues?: {
    name?: string
    generalObjective?: string
    level?: string
    durationWeeks?: number
    startDate?: string
    status?: string
  }
  mesocycleId?: string
}

export function MesocycleForm({ action, defaultValues, mesocycleId }: Props) {
  const [state, formAction, isPending] = useActionState(action, { error: null })

  if (state.success) {
    return (
      <Alert className="border-[#00C4CC]/30 bg-[#00C4CC]/10">
        <AlertDescription className="text-[#00C4CC]">{state.success}</AlertDescription>
      </Alert>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {mesocycleId && <input type="hidden" name="mesocycleId" value={mesocycleId} />}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre del mesociclo</Label>
        <Input
          id="name" name="name" required disabled={isPending}
          defaultValue={defaultValues?.name}
          placeholder="Ej. Pretemporada Verano 2025"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="generalObjective">Objetivo general</Label>
        <Textarea
          id="generalObjective" name="generalObjective" required rows={2} disabled={isPending}
          defaultValue={defaultValues?.generalObjective}
          placeholder="Foco principal del período (físico, técnico, táctico…)"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="level">Nivel del grupo</Label>
          <select
            id="level" name="level" required disabled={isPending}
            defaultValue={defaultValues?.level ?? '5ta_masculino'}
            className={selectClass}
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationWeeks">Duración (semanas)</Label>
          <Input
            id="durationWeeks" name="durationWeeks" type="number"
            min={1} max={52} required disabled={isPending}
            defaultValue={defaultValues?.durationWeeks ?? 4}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">Fecha de inicio (opcional)</Label>
        <Input
          id="startDate" name="startDate" type="date" disabled={isPending}
          defaultValue={defaultValues?.startDate ?? ''}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? 'Guardando...' : mesocycleId ? 'Guardar cambios' : 'Crear mesociclo'}
      </Button>
    </form>
  )
}
