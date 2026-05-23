'use client'

import { useActionState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createSessionAction } from '@/actions/training'
import type { TrainingState } from '@/actions/training'

interface Props {
  microcycleId: string
}

export function SessionForm({ microcycleId }: Props) {
  const [state, formAction, isPending] = useActionState(createSessionAction, { error: null })

  if (state.success) {
    return (
      <Alert className="border-[#00C4CC]/30 bg-[#00C4CC]/10">
        <AlertDescription className="text-[#00C4CC]">{state.success}</AlertDescription>
      </Alert>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <input type="hidden" name="microcycleId" value={microcycleId} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduledAt">Fecha y hora</Label>
          <Input
            id="scheduledAt" name="scheduledAt" type="datetime-local"
            required disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationMin">Duración (min)</Label>
          <Input
            id="durationMin" name="durationMin" type="number"
            min={15} max={240} defaultValue={90} disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="coachNotes">Notas del entrenador (opcional)</Label>
        <Textarea id="coachNotes" name="coachNotes" rows={2} disabled={isPending} />
      </div>

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? 'Creando…' : 'Crear sesión'}
      </Button>
    </form>
  )
}
