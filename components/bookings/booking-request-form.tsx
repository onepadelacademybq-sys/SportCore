'use client'

import { useState, useActionState } from 'react'
import { requestBookingAction } from '@/actions/bookings'
import type { CoachOption } from '@/actions/bookings'
import { WeeklyCalendar } from './weekly-calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

const selectClass =
  'w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground ' +
  'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

// Opciones de hora: 05:00 – 21:00
const HOURS = Array.from({ length: 17 }, (_, i) => {
  const h = (i + 5).toString().padStart(2, '0')
  return `${h}:00`
})

function nextHour(time: string): string {
  const idx = HOURS.indexOf(time)
  return HOURS[Math.min(idx + 1, HOURS.length - 1)]
}

interface Props {
  coaches: CoachOption[]
}

export function BookingRequestForm({ coaches }: Props) {
  const [state, action, isPending] = useActionState(requestBookingAction, { error: null })

  const [coachId,   setCoachId]   = useState('')
  const [date,      setDate]      = useState('')
  const [startTime, setStartTime] = useState(HOURS[12]) // 17:00
  const [endTime,   setEndTime]   = useState(HOURS[13]) // 18:00

  // Fecha mínima: mañana
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  function handleStartChange(value: string) {
    setStartTime(value)
    setEndTime(nextHour(value))
  }

  function handleSlotSelect(selectedDate: string, selectedStart: string, selectedEnd: string) {
    setDate(selectedDate)
    setStartTime(selectedStart)
    setEndTime(selectedEnd)
  }

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

      {/* Coach selector */}
      <div className="space-y-2">
        <Label htmlFor="coachId">Entrenador</Label>
        <select
          id="coachId"
          name="coachId"
          required
          disabled={isPending}
          value={coachId}
          onChange={(e) => setCoachId(e.target.value)}
          className={selectClass}
        >
          <option value="">Selecciona un entrenador...</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </select>
      </div>

      {/* Weekly availability calendar — visible once a coach is chosen */}
      {coachId && (
        <WeeklyCalendar
          coachId={coachId}
          selectedDate={date}
          selectedStart={startTime}
          onSelectSlot={handleSlotSelect}
        />
      )}

      {/* Date & time (auto-filled by calendar, still manually adjustable) */}
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
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startTime">Hora inicio</Label>
          <select
            id="startTime"
            name="startTime"
            required
            disabled={isPending}
            value={startTime}
            onChange={(e) => handleStartChange(e.target.value)}
            className={selectClass}
          >
            {HOURS.slice(0, -1).map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">Hora fin</Label>
          <select
            id="endTime"
            name="endTime"
            required
            disabled={isPending}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={selectClass}
          >
            {HOURS.slice(1).map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
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
