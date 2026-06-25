'use client'

import { useActionState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { TrainingState } from '@/actions/training'

type FormAction = (prev: TrainingState, formData: FormData) => Promise<TrainingState>

interface Props {
  action: FormAction
  macrocycleId?: string
  defaultValues?: {
    name?: string
    generalObjective?: string
    startDate?: string
    endDate?: string
  }
}

export function MacrocycleForm({ action, macrocycleId, defaultValues }: Props) {
  const [state, formAction, isPending] = useActionState(action, { error: null })

  if (state.success) {
    return (
      <Alert className="border-brand/30 bg-brand/10">
        <AlertDescription className="text-brand">{state.success}</AlertDescription>
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

      {macrocycleId && <input type="hidden" name="macrocycleId" value={macrocycleId} />}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre del macrociclo</Label>
        <Input
          id="name" name="name" required disabled={isPending}
          defaultValue={defaultValues?.name}
          placeholder="Ej. Temporada 2026"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="generalObjective">Objetivo general (opcional)</Label>
        <Textarea
          id="generalObjective" name="generalObjective" rows={2} disabled={isPending}
          defaultValue={defaultValues?.generalObjective}
          placeholder="Meta de la temporada (competitiva, desarrollo, etc.)"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Inicio (opcional)</Label>
          <Input id="startDate" name="startDate" type="date" disabled={isPending} defaultValue={defaultValues?.startDate ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Fin (opcional)</Label>
          <Input id="endDate" name="endDate" type="date" disabled={isPending} defaultValue={defaultValues?.endDate ?? ''} />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? 'Guardando...' : macrocycleId ? 'Guardar cambios' : 'Crear macrociclo'}
      </Button>
    </form>
  )
}
