'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getCoachAvailability } from '@/actions/bookings'
import { Button } from '@/components/ui/button'

// Slots de 1 hora: 05:00 – 20:00
const SLOT_HOURS = Array.from({ length: 16 }, (_, i) => i + 5)

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// Anticipación mínima en horas según rol
const ADVANCE_HOURS: Record<string, number> = {
  player: 48,
  admin:  1,
  coach:  1,
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d
}

function toLocalDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

interface BusySlot { start_time: string; end_time: string }

interface Props {
  coachId:       string
  selectedDate:  string
  selectedStart: string
  onSelectSlot:  (date: string, start: string, end: string) => void
  userRole:      'player' | 'admin' | 'coach'
}

export function WeeklyCalendar({ coachId, selectedDate, selectedStart, onSelectSlot, userRole }: Props) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [busySlots, setBusySlots]   = useState<BusySlot[]>([])
  const [isFetching, setIsFetching] = useState(false)

  // Earliest bookable moment — computed fresh on each render (won't auto-update
  // while open, but that's acceptable for a booking form)
  const earliestBookable = new Date(
    Date.now() + (ADVANCE_HOURS[userRole] ?? 48) * 60 * 60 * 1000,
  )

  const baseMonday = getMondayOfWeek(new Date())
  baseMonday.setDate(baseMonday.getDate() + weekOffset * 7)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseMonday)
    d.setDate(baseMonday.getDate() + i)
    return d
  })

  const weekEndDate = new Date(weekDays[6])
  weekEndDate.setDate(weekEndDate.getDate() + 1)
  weekEndDate.setHours(0, 0, 0, 0)

  const weekStartISO = weekDays[0].toISOString()
  const weekEndISO   = weekEndDate.toISOString()

  useEffect(() => {
    let cancelled = false
    setIsFetching(true)
    setBusySlots([])

    getCoachAvailability(coachId, weekStartISO, weekEndISO)
      .then(slots => { if (!cancelled) setBusySlots(slots) })
      .catch(()   => { if (!cancelled) setBusySlots([]) })
      .finally(() => { if (!cancelled) setIsFetching(false) })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachId, weekOffset])

  function isBusy(day: Date, hour: number): boolean {
    const slotStart = new Date(day); slotStart.setHours(hour, 0, 0, 0)
    const slotEnd   = new Date(day); slotEnd.setHours(hour + 1, 0, 0, 0)
    return busySlots.some(b => new Date(b.start_time) < slotEnd && new Date(b.end_time) > slotStart)
  }

  // A slot is blocked when it starts before the earliest bookable moment.
  // Uses exact datetime — not just the day — so today's future slots remain available
  // when the user's advance window allows it (e.g. admin can book 1h ahead).
  function isTooSoon(day: Date, hour: number): boolean {
    const slotStart = new Date(day)
    slotStart.setHours(hour, 0, 0, 0)
    return slotStart < earliestBookable
  }

  function isSelected(day: Date, hour: number): boolean {
    if (!selectedDate || !selectedStart) return false
    const h = String(hour).padStart(2, '0')
    return toLocalDateStr(day) === selectedDate && `${h}:00` === selectedStart
  }

  function handleClick(day: Date, hour: number) {
    const h    = String(hour).padStart(2, '0')
    const endH = String(hour + 1).padStart(2, '0')
    onSelectSlot(toLocalDateStr(day), `${h}:00`, `${endH}:00`)
  }

  const startLabel = weekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  const endLabel   = weekDays[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  const weekLabel  = `${startLabel} – ${endLabel}`

  // Disable the "back" button when the entire previous week would be blocked
  const prevWeekMonday = new Date(baseMonday)
  prevWeekMonday.setDate(prevWeekMonday.getDate() - 7)
  const prevWeekLastSlot = new Date(prevWeekMonday)
  prevWeekLastSlot.setDate(prevWeekLastSlot.getDate() + 6)
  prevWeekLastSlot.setHours(SLOT_HOURS[SLOT_HOURS.length - 1], 0, 0, 0)
  const canGoBack = prevWeekLastSlot >= earliestBookable

  return (
    <div className="rounded-lg border border-border p-3 space-y-3">
      {/* Advance window notice */}
      <p className="text-[10px] text-muted-foreground">
        {userRole === 'admin'
          ? 'Reservas disponibles desde 1 hora en adelante.'
          : 'Reservas disponibles con mínimo 48 horas de anticipación.'}
      </p>

      {/* Week navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          disabled={!canGoBack}
          onClick={() => setWeekOffset(w => w - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs font-medium text-center capitalize">{weekLabel}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={() => setWeekOffset(w => w + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid */}
      <div className={`overflow-x-auto transition-opacity duration-150 ${isFetching ? 'opacity-40' : 'opacity-100'}`}>
        <div className="min-w-[500px]">
          {/* Day headers */}
          <div className="grid grid-cols-[40px_repeat(7,1fr)] mb-1.5">
            <div />
            {weekDays.map((d, i) => (
              <div key={i} className="text-center leading-tight">
                <p className="text-[10px] text-muted-foreground">{DAY_LABELS[i]}</p>
                <p className="text-xs font-semibold">{d.getDate()}</p>
              </div>
            ))}
          </div>

          {/* Hour rows */}
          <div className="space-y-px">
            {SLOT_HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-[40px_repeat(7,1fr)] gap-px">
                <div className="text-[10px] text-muted-foreground flex items-center justify-end pr-1.5 tabular-nums">
                  {String(hour).padStart(2, '0')}:00
                </div>

                {weekDays.map((day, di) => {
                  const busy     = isBusy(day, hour)
                  const tooSoon  = isTooSoon(day, hour)
                  const selected = isSelected(day, hour)
                  const disabled = busy || tooSoon

                  return (
                    <button
                      key={di}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && handleClick(day, hour)}
                      title={
                        selected  ? 'Seleccionado'
                        : busy    ? 'Ocupado'
                        : tooSoon ? 'No disponible aún'
                        : `Reservar ${String(hour).padStart(2, '0')}:00`
                      }
                      className={`
                        h-6 rounded-[3px] transition-colors
                        ${selected
                          ? 'bg-[#00C4CC]'
                          : busy
                            ? 'bg-muted cursor-not-allowed'
                            : tooSoon
                              ? 'bg-muted/25 cursor-default'
                              : 'bg-[#00C4CC]/20 hover:bg-[#00C4CC]/50 cursor-pointer'
                        }
                      `}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-[2px] bg-[#00C4CC]/20 shrink-0" />
          Disponible
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-[2px] bg-muted shrink-0" />
          Ocupado
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-[2px] bg-[#00C4CC] shrink-0" />
          Seleccionado
        </span>
      </div>
    </div>
  )
}
