'use client'

import { useEffect, useState } from 'react'
import type { PublicCourt } from '@/actions/public'

interface Props {
  slug:           string
  courts:         PublicCourt[]
  selectedCourt?: string
  selectedDate?:  string
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function maxDateStr(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

export function BookingFilterForm({ slug, courts, selectedCourt, selectedDate }: Props) {
  const [court, setCourt] = useState(selectedCourt ?? '')
  const [date, setDate]   = useState(selectedDate ?? '')

  useEffect(() => {
    setCourt(selectedCourt ?? '')
    setDate(selectedDate ?? '')
  }, [selectedCourt, selectedDate])

  return (
    <form
      method="get"
      action={`/club/${slug}/book`}
      className="rounded-xl border bg-card p-5 space-y-4"
    >
      <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Selecciona espacio y fecha
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Court */}
        <div className="space-y-1.5">
          <label htmlFor="court" className="text-sm font-medium">
            Espacio
          </label>
          <select
            id="court"
            name="court"
            required
            value={court}
            onChange={(e) => setCourt(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="" disabled>Elige un espacio...</option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label htmlFor="date" className="text-sm font-medium">
            Fecha
          </label>
          <input
            id="date"
            type="date"
            name="date"
            required
            min={todayStr()}
            max={maxDateStr()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Ver disponibilidad
      </button>
    </form>
  )
}
