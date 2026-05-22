'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GroupSchedule } from '@/actions/groups'

// 0=Dom, 1=Lun, ..., 6=Sáb
const DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
]

const HOURS = Array.from({ length: 17 }, (_, i) => {
  const h = (i + 5).toString().padStart(2, '0')
  return `${h}:00`
})

interface ScheduleEntry {
  dayOfWeek: number
  startTime: string
  endTime: string
}

function normalizeTime(t: string): string {
  // DB returns "HH:MM:SS", we want "HH:MM"
  return t.slice(0, 5)
}

interface Props {
  initialSchedules?: GroupSchedule[]
}

export function ScheduleBuilder({ initialSchedules = [] }: Props) {
  const [entries, setEntries] = useState<ScheduleEntry[]>(() =>
    initialSchedules.map((s) => ({
      dayOfWeek: s.day_of_week,
      startTime: normalizeTime(s.start_time),
      endTime:   normalizeTime(s.end_time),
    })),
  )

  const json = JSON.stringify(entries)

  function add() {
    setEntries((prev) => [...prev, { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }])
  }

  function remove(i: number) {
    setEntries((prev) => prev.filter((_, idx) => idx !== i))
  }

  function update<K extends keyof ScheduleEntry>(i: number, key: K, value: ScheduleEntry[K]) {
    setEntries((prev) =>
      prev.map((e, idx) => {
        if (idx !== i) return e
        const next = { ...e, [key]: value }
        // Auto-advance endTime when startTime changes
        if (key === 'startTime') {
          const startIdx = HOURS.indexOf(value as string)
          if (startIdx !== -1 && startIdx < HOURS.length - 1) {
            next.endTime = HOURS[startIdx + 1]
          }
        }
        return next
      }),
    )
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="schedulesJson" value={json} />

      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground">Sin horarios. Agrega al menos uno.</p>
      )}

      {entries.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 flex-wrap">
          <select
            value={entry.dayOfWeek}
            onChange={(e) => update(i, 'dayOfWeek', Number(e.target.value))}
            className="rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          <select
            value={entry.startTime}
            onChange={(e) => update(i, 'startTime', e.target.value)}
            className="rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {HOURS.slice(0, -1).map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>

          <span className="text-muted-foreground text-sm">–</span>

          <select
            value={entry.endTime}
            onChange={(e) => update(i, 'endTime', e.target.value)}
            className="rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {HOURS.slice(1).map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => remove(i)}
            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1.5 text-xs">
        <Plus className="h-3.5 w-3.5" />
        Agregar horario
      </Button>
    </div>
  )
}
