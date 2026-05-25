'use client'

import { Fragment, useState, useTransition, useCallback } from 'react'
import { updateAvailability } from '@/actions/coach-profile'
import type { CoachAvailabilitySlot } from '@/actions/coach-profile'
import { Button } from '@/components/ui/button'

const DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
]

// Hours 5 through 21 → slots 05:00-06:00 … 21:00-22:00
const HOURS = Array.from({ length: 17 }, (_, i) => i + 5)

function slotKey(day: number, hour: number) {
  return `${day}_${hour}`
}

function initSelected(slots: CoachAvailabilitySlot[]): Set<string> {
  const set = new Set<string>()
  for (const s of slots) {
    const hour = parseInt(s.start_time.split(':')[0], 10)
    set.add(slotKey(s.day_of_week, hour))
  }
  return set
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

interface Props {
  availability: CoachAvailabilitySlot[]
}

export function AvailabilityGrid({ availability }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => initSelected(availability))
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const toggle = useCallback((day: number, hour: number) => {
    const key = slotKey(day, hour)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setMsg(null)
  }, [])

  function save() {
    const slots = [...selected].map((key) => {
      const [d, h] = key.split('_').map(Number)
      return {
        day_of_week: d,
        start_time: `${pad(h)}:00:00`,
        end_time: `${pad(h + 1)}:00:00`,
      }
    })

    startTransition(async () => {
      const res = await updateAvailability(slots)
      setMsg({ text: res.success ?? res.error ?? '', ok: !res.error })
    })
  }

  const isWeekend = (day: number) => day === 6 || day === 0

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Disponibilidad horaria</h3>
        <p className="text-xs text-muted-foreground">Haz clic en las celdas para marcar tus franjas disponibles</p>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid gap-px bg-border rounded-md overflow-hidden"
          style={{ gridTemplateColumns: '52px repeat(7, minmax(44px, 1fr))' }}
        >
          {/* Header row */}
          <div className="bg-muted/30 px-2 py-1.5" />
          {DAYS.map((d) => (
            <div
              key={d.value}
              className={`px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide ${
                isWeekend(d.value) ? 'bg-muted/50 text-muted-foreground' : 'bg-muted/30 text-foreground'
              }`}
            >
              {d.label}
            </div>
          ))}

          {/* Hour rows */}
          {HOURS.map((hour) => (
            <Fragment key={hour}>
              {/* Hour label */}
              <div
                className="bg-muted/20 px-2 flex items-center justify-end text-[10px] text-muted-foreground tabular-nums"
              >
                {pad(hour)}:00
              </div>

              {/* Day cells */}
              {DAYS.map((d) => {
                const key = slotKey(d.value, hour)
                const isOn = selected.has(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(d.value, hour)}
                    className={`h-8 w-full transition-colors ${
                      isOn
                        ? 'bg-[#00C4CC] hover:bg-[#00b3ba]'
                        : isWeekend(d.value)
                          ? 'bg-muted/40 hover:bg-muted/70'
                          : 'bg-card hover:bg-muted/40'
                    }`}
                    title={`${d.label} ${pad(hour)}:00`}
                  />
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Legend + save */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-3 h-3 rounded-sm bg-[#00C4CC]" /> Disponible
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-3 h-3 rounded-sm bg-muted/40 border border-border" /> No disponible
          </span>
        </div>
        <div className="flex items-center gap-3">
          {msg && (
            <p className={`text-xs ${msg.ok ? 'text-emerald-500' : 'text-destructive'}`}>{msg.text}</p>
          )}
          <Button size="sm" onClick={save} disabled={pending}>
            {pending ? 'Guardando…' : 'Guardar disponibilidad'}
          </Button>
        </div>
      </div>
    </div>
  )
}
