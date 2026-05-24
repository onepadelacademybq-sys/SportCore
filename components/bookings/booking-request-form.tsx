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

const HOURS = Array.from({ length: 17 }, (_, i) => {
  const h = (i + 5).toString().padStart(2, '0')
  return `${h}:00`
})

function nextHour(time: string): string {
  const idx = HOURS.indexOf(time)
  return HOURS[Math.min(idx + 1, HOURS.length - 1)]
}

const ADVANCE_HOURS: Record<string, number> = {
  player: 48,
  admin:   1,
  coach:   1,
}

// ─── Pricing (Línea A — Clases personalizadas) ────────────────────────────────

type TimeCategory = 'am' | 'pm' | 'weekend'
type SizeCategory = 'duo' | 'trio' | 'quartet'

const SINGLE_PRICES: Record<TimeCategory, Record<SizeCategory, number>> = {
  am:      { duo:  86_000, trio: 106_000, quartet: 116_000 },
  pm:      { duo: 130_000, trio: 150_000, quartet: 160_000 },
  weekend: { duo: 138_000, trio: 158_000, quartet: 168_000 },
}

// Module prices apply to individual/dupla slots on weekdays only
const MODULE_PRICES: Record<8 | 16, Record<'am' | 'pm', number>> = {
  8:  { am:   640_000, pm:   967_200 },
  16: { am: 1_169_600, pm: 1_768_000 },
}

function getTimeCategory(date: string, startTime: string): TimeCategory {
  if (!date || !startTime) return 'am'
  const dow = new Date(`${date}T00:00:00`).getDay()
  if (dow === 0 || dow === 6) return 'weekend'
  return parseInt(startTime, 10) < 16 ? 'am' : 'pm'
}

function getSizeCategory(people: number): SizeCategory {
  if (people <= 2) return 'duo'
  if (people === 3) return 'trio'
  return 'quartet'
}

function formatCOP(n: number): string {
  return '$' + n.toLocaleString('es-CO')
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  coaches:          CoachOption[]
  userRole:         'player' | 'admin' | 'coach'
  availableClasses?: number
}

export function BookingRequestForm({ coaches, userRole, availableClasses = 0 }: Props) {
  const [state, action, isPending] = useActionState(requestBookingAction, { error: null })

  const [coachId,      setCoachId]      = useState('')
  const [date,         setDate]         = useState('')
  const [startTime,    setStartTime]    = useState(HOURS[12])
  const [endTime,      setEndTime]      = useState(HOURS[13])
  const [peopleCount,    setPeopleCount]    = useState<1 | 2 | 3 | 4>(1)
  const [selectedModule, setSelectedModule] = useState<null | 8 | 16>(null)
  const [paymentMethod,  setPaymentMethod]  = useState<'transfer' | 'wallet'>('transfer')

  const earliestBookable = new Date(Date.now() + (ADVANCE_HOURS[userRole] ?? 48) * 60 * 60 * 1000)
  const minDate = earliestBookable.toISOString().split('T')[0]

  function handleStartChange(value: string) {
    setStartTime(value)
    setEndTime(nextHour(value))
    setSelectedModule(null)
  }

  function handleSlotSelect(selectedDate: string, selectedStart: string, selectedEnd: string) {
    setDate(selectedDate)
    setStartTime(selectedStart)
    setEndTime(selectedEnd)
    setSelectedModule(null)
  }

  // Derived pricing
  const timeCategory = getTimeCategory(date, startTime)
  const sizeCategory = getSizeCategory(peopleCount)
  const singlePrice  = date ? SINGLE_PRICES[timeCategory][sizeCategory] : null
  const showModules  = date && timeCategory !== 'weekend' && sizeCategory === 'duo'

  // Effective price sent to the server — module price when one is selected, single class otherwise
  const effectivePrice = (showModules && selectedModule && singlePrice !== null)
    ? MODULE_PRICES[selectedModule][timeCategory as 'am' | 'pm']
    : (singlePrice ?? 0)

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
          id="coachId" name="coachId" required disabled={isPending}
          value={coachId} onChange={(e) => setCoachId(e.target.value)}
          className={selectClass}
        >
          <option value="">Selecciona un entrenador...</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name}</option>
          ))}
        </select>
      </div>

      {/* Weekly availability calendar */}
      {coachId && (
        <WeeklyCalendar
          coachId={coachId}
          selectedDate={date}
          selectedStart={startTime}
          onSelectSlot={handleSlotSelect}
          userRole={userRole}
        />
      )}

      {/* Date & time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date" name="date" type="date"
            min={minDate} required disabled={isPending}
            value={date} onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startTime">Hora inicio</Label>
          <select id="startTime" name="startTime" required disabled={isPending}
            value={startTime} onChange={(e) => handleStartChange(e.target.value)}
            className={selectClass}>
            {HOURS.slice(0, -1).map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">Hora fin</Label>
          <select id="endTime" name="endTime" required disabled={isPending}
            value={endTime} onChange={(e) => setEndTime(e.target.value)}
            className={selectClass}>
            {HOURS.slice(1).map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      {/* People count — shown once a date is chosen */}
      {date && (
        <div className="space-y-2">
          <Label>Número de personas</Label>
          <div className="flex gap-2">
            {([1, 2, 3, 4] as const).map((n) => (
              <button
                key={n} type="button"
                onClick={() => setPeopleCount(n)}
                className={`flex-1 py-2 text-sm rounded-md border transition-colors ${
                  peopleCount === n
                    ? 'border-[#00C4CC] bg-[#00C4CC]/10 text-foreground font-medium'
                    : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            1 y 2 personas tienen el mismo precio
          </p>
        </div>
      )}

      {/* Price panel */}
      {singlePrice !== null && (
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {timeCategory === 'am' ? 'Turno AM · 05:00–15:00'
               : timeCategory === 'pm' ? 'Turno PM · 16:00–21:00'
               : 'Fin de semana / festivo'}
            </span>
            <span>
              {sizeCategory === 'duo'     ? '1–2 personas'
               : sizeCategory === 'trio'  ? 'Trío (3 personas)'
               : 'Cuarteto (4 personas)'}
            </span>
          </div>

          {/* Single class */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="text-sm font-medium">Clase suelta</span>
            <span className="text-lg font-bold text-[#00C4CC]">{formatCOP(singlePrice)}</span>
          </div>

          {/* Module options */}
          {showModules && (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                Módulos con descuento
              </p>
              {([8, 16] as const).map((n) => {
                const tc          = timeCategory as 'am' | 'pm'
                const modulePrice = MODULE_PRICES[n][tc]
                const savings     = singlePrice * n - modulePrice
                const pct         = n === 8 ? 7 : 15
                const isActive    = selectedModule === n
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSelectedModule(isActive ? null : n)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md border transition-colors text-left ${
                      isActive
                        ? 'border-[#00C4CC] bg-[#00C4CC]/10'
                        : 'border-border bg-muted/40 hover:border-[#00C4CC]/50 hover:bg-muted/60'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{n} clases</p>
                      <p className="text-[10px] text-emerald-500">
                        {pct}% descuento · ahorrás {formatCOP(savings)}
                      </p>
                    </div>
                    <span className={`text-base font-bold ${isActive ? 'text-[#00C4CC]' : ''}`}>
                      {formatCOP(modulePrice)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Hidden fields */}
      <input type="hidden" name="peopleCount"   value={peopleCount} />
      <input type="hidden" name="price"         value={paymentMethod === 'wallet' ? 0 : effectivePrice} />
      <input type="hidden" name="moduleClasses" value={selectedModule ?? 0} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />

      {/* Payment method selector — shown once a date is chosen */}
      {date && (
        <div className="space-y-2">
          <Label>Método de pago</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('transfer')}
              className={`flex-1 py-2.5 px-3 text-sm rounded-md border transition-colors text-left ${
                paymentMethod === 'transfer'
                  ? 'border-[#00C4CC] bg-[#00C4CC]/10 font-medium'
                  : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
              }`}
            >
              <p className="text-sm">Transferencia bancaria</p>
              <p className="text-[10px] text-muted-foreground">Sube el comprobante después de reservar</p>
            </button>

            {availableClasses > 0 ? (
              <button
                type="button"
                onClick={() => setPaymentMethod('wallet')}
                className={`flex-1 py-2.5 px-3 text-sm rounded-md border transition-colors text-left ${
                  paymentMethod === 'wallet'
                    ? 'border-[#00C4CC] bg-[#00C4CC]/10 font-medium'
                    : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                }`}
              >
                <p className="text-sm">Usar mis clases</p>
                <p className="text-[10px] text-emerald-500">
                  {availableClasses} clase{availableClasses !== 1 ? 's' : ''} disponible{availableClasses !== 1 ? 's' : ''}
                </p>
              </button>
            ) : (
              <div className="flex-1 py-2.5 px-3 rounded-md border border-border bg-muted/20 opacity-50 cursor-not-allowed">
                <p className="text-sm text-muted-foreground">Usar mis clases</p>
                <p className="text-[10px] text-muted-foreground">
                  Compra un paquete de clases para habilitar esta opción
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea
          id="notes" name="notes"
          placeholder="Objetivos de la sesión, nivel, etc."
          rows={3} disabled={isPending}
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
