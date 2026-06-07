'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, Phone } from 'lucide-react'
import { getCoachAvailability, type BusySlot } from '@/actions/bookings'
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

type AvailableWindow = { day_of_week: number; start_time: string; end_time: string }

interface Props {
  coachId:       string
  selectedDate:  string
  selectedStart: string
  onSelectSlot:  (date: string, start: string, end: string) => void
  userRole:      'player' | 'admin' | 'coach'
}

type SlotState = 'available' | 'selected' | 'busy-individual' | 'busy-group' | 'coach-unavailable' | 'too-soon'

export function WeeklyCalendar({ coachId, selectedDate, selectedStart, onSelectSlot, userRole }: Props) {
  const [weekOffset,       setWeekOffset]       = useState(0)
  const [busySlots,        setBusySlots]        = useState<BusySlot[]>([])
  const [availableWindows, setAvailableWindows] = useState<AvailableWindow[] | null>(null)
  const [isFetching,       setIsFetching]       = useState(false)
  const [showContactBanner, setShowContactBanner] = useState(false)

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
    setShowContactBanner(false)

    getCoachAvailability(coachId, weekStartISO, weekEndISO)
      .then(result => {
        if (!cancelled) {
          setBusySlots(result.busySlots)
          setAvailableWindows(result.availableWindows)
        }
      })
      .catch(() => { if (!cancelled) { setBusySlots([]); setAvailableWindows(null) } })
      .finally(() => { if (!cancelled) setIsFetching(false) })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachId, weekOffset])

  // ── Clasificación de cada slot ──────────────────────────────────────────────

  function getBusyType(day: Date, hour: number): 'individual' | 'group' | null {
    const slotStart = new Date(day); slotStart.setHours(hour, 0, 0, 0)
    const slotEnd   = new Date(day); slotEnd.setHours(hour + 1, 0, 0, 0)
    const match = busySlots.find(
      b => new Date(b.start_time) < slotEnd && new Date(b.end_time) > slotStart,
    )
    if (!match) return null
    return match.is_group ? 'group' : 'individual'
  }

  // Slot fuera de las ventanas de disponibilidad del entrenador.
  // availableWindows === null → entrenador sin horario configurado → sin restricción.
  function isUnavailable(day: Date, hour: number): boolean {
    if (!availableWindows) return false
    const dow = day.getDay()
    return !availableWindows.some(w => {
      if (w.day_of_week !== dow) return false
      const wStart = parseInt(w.start_time.substring(0, 2), 10)
      const wEnd   = parseInt(w.end_time.substring(0, 2), 10)
      return hour >= wStart && hour + 1 <= wEnd
    })
  }

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

  function resolveSlotState(day: Date, hour: number): SlotState {
    if (isSelected(day, hour)) return 'selected'
    const busyType = getBusyType(day, hour)
    if (busyType === 'individual') return 'busy-individual'
    if (busyType === 'group')      return 'busy-group'
    if (isUnavailable(day, hour)) return 'coach-unavailable'
    if (isTooSoon(day, hour))     return 'too-soon'
    return 'available'
  }

  // ── Estilos por estado ──────────────────────────────────────────────────────

  const slotStyles: Record<SlotState, string> = {
    'available':        'bg-[#00C4CC]/20 hover:bg-[#00C4CC]/50 cursor-pointer',
    'selected':         'bg-[#00C4CC] ring-2 ring-[#00C4CC] ring-offset-1',
    'busy-individual':  'bg-rose-300 dark:bg-rose-700/70 cursor-not-allowed',
    'busy-group':       'bg-violet-300 dark:bg-violet-700/70 cursor-not-allowed',
    'coach-unavailable':'bg-slate-200 dark:bg-slate-700 cursor-not-allowed',
    'too-soon':         'bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 cursor-pointer',
  }

  const slotTitles: Record<SlotState, string> = {
    'available':         '',
    'selected':          'Seleccionado',
    'busy-individual':   'Clase individual reservada',
    'busy-group':        'Sesión de grupo de entrenamiento',
    'coach-unavailable': 'Entrenador no disponible',
    'too-soon':          'Contactar administración',
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleClick(day: Date, hour: number, state: SlotState) {
    if (state === 'too-soon') {
      setShowContactBanner(true)
      return
    }
    if (state !== 'available') return
    const h    = String(hour).padStart(2, '0')
    const endH = String(hour + 1).padStart(2, '0')
    onSelectSlot(toLocalDateStr(day), `${h}:00`, `${endH}:00`)
  }

  // ── Navegación ──────────────────────────────────────────────────────────────

  const startLabel = weekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  const endLabel   = weekDays[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  const weekLabel  = `${startLabel} – ${endLabel}`

  const prevWeekMonday = new Date(baseMonday)
  prevWeekMonday.setDate(prevWeekMonday.getDate() - 7)
  const prevWeekLastSlot = new Date(prevWeekMonday)
  prevWeekLastSlot.setDate(prevWeekLastSlot.getDate() + 6)
  prevWeekLastSlot.setHours(SLOT_HOURS[SLOT_HOURS.length - 1], 0, 0, 0)
  const canGoBack = prevWeekLastSlot >= earliestBookable

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-lg border border-border p-3 space-y-3">
      {/* Advance window notice */}
      <p className="text-[10px] text-muted-foreground">
        {userRole === 'admin' || userRole === 'coach'
          ? 'Reservas disponibles desde 1 hora en adelante.'
          : 'Reservas disponibles con mínimo 48 horas de anticipación.'}
      </p>

      {/* Banner de contacto (tooSoon) */}
      {showContactBanner && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          <Phone className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="flex-1">
            Este horario requiere confirmación previa.{' '}
            <strong>Contáctanos directamente</strong> para verificar disponibilidad.
          </span>
          <button
            type="button"
            onClick={() => setShowContactBanner(false)}
            className="shrink-0 opacity-60 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Navegación de semana */}
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
          {/* Cabecera de días */}
          <div className="grid grid-cols-[40px_repeat(7,1fr)] mb-1.5">
            <div />
            {weekDays.map((d, i) => (
              <div key={i} className="text-center leading-tight">
                <p className="text-[10px] text-muted-foreground">{DAY_LABELS[i]}</p>
                <p className="text-xs font-semibold">{d.getDate()}</p>
              </div>
            ))}
          </div>

          {/* Filas de horas */}
          <div className="space-y-px">
            {SLOT_HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-[40px_repeat(7,1fr)] gap-px">
                <div className="text-[10px] text-muted-foreground flex items-center justify-end pr-1.5 tabular-nums">
                  {String(hour).padStart(2, '0')}:00
                </div>

                {weekDays.map((day, di) => {
                  const state = resolveSlotState(day, hour)
                  const disabled = state !== 'available' && state !== 'too-soon'

                  return (
                    <button
                      key={di}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleClick(day, hour, state)}
                      title={
                        slotTitles[state] ||
                        `Reservar ${String(hour).padStart(2, '0')}:00`
                      }
                      className={`h-6 rounded-[3px] transition-colors ${slotStyles[state]}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-[2px] bg-[#00C4CC]/20 shrink-0" />
          Disponible
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-[2px] bg-[#00C4CC] shrink-0" />
          Seleccionado
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-[2px] bg-rose-300 shrink-0" />
          Clase individual
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-[2px] bg-violet-300 shrink-0" />
          Grupo activo
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-[2px] bg-slate-200 shrink-0" />
          No disponible
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-[2px] bg-amber-100 shrink-0" />
          Consultar admin
        </span>
      </div>
    </div>
  )
}
