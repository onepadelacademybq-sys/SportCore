'use client'

import { useActionState } from 'react'
import { requestBookingAction } from '@/actions/bookings'
import type { CoachOption } from '@/actions/bookings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

const selectClass =
  'w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground ' +
  'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

interface Props {
  coaches: CoachOption[]
}

export function BookingRequestForm({ coaches }: Props) {
  const [state, action, isPending] = useActionState(requestBookingAction, { error: null })

  // Fecha mínima: mañana
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  if (state.success) {
    return (
      <Alert className="border-[#00C4CC]/30 bg-[#00C4CC]/10">
        <AlertDescription className="text-[#00C4CC]">{state.success}</AlertDescription>
      </Alert>
    )
  }

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="coachId">Entrenador</Label>
        <select id="coachId" name="coachId" required disabled={isPending} className={selectClass}>
          <option value="">Selecciona un entrenador...</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date"
            name="date"
            type="date"
            min={minDate}
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startTime">Hora inicio</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">Hora fin</Label>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Objetivos de la sesión, nivel, etc."
          rows={3}
          disabled={isPending}
        />
      </div>

      <Button type="submit" disabled={isPending || coaches.length === 0} className="w-full sm:w-auto">
        {isPending ? 'Solicitando...' : 'Solicitar reserva'}
      </Button>

      {coaches.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No hay entrenadores disponibles en este momento.
        </p>
      )}
    </form>
  )
}
