'use client'

import { useActionState, useState, useEffect } from 'react'
import { updateTournamentVenueAction } from '@/actions/tournaments'
import { calcCourtCost, recommendedCourts, courtSlotType, durationHours, formatCOP, SLOT_LABELS } from '@/lib/tournaments/costs'
import { Button } from '@/components/ui/button'
import { Save, Calculator } from 'lucide-react'

interface Props {
  tournamentId: string
  confirmedPairs: number
  initial: {
    tournament_date: string | null
    start_time: string | null
    end_time: string | null
    num_courts: number | null
    court_cost_total: string | null
  }
}

export function VenueForm({ tournamentId, confirmedPairs, initial }: Props) {
  const [state, action, pending] = useActionState(updateTournamentVenueAction, null)

  const [date, setDate]       = useState(initial.tournament_date ?? '')
  const [start, setStart]     = useState(initial.start_time?.slice(0, 5) ?? '')
  const [end, setEnd]         = useState(initial.end_time?.slice(0, 5) ?? '')
  const [courts, setCourts]   = useState<number>(initial.num_courts ?? recommendedCourts(confirmedPairs) ?? 2)

  const recommended = recommendedCourts(confirmedPairs)

  // Live cost calculation
  const cost    = (date && start && end && courts > 0) ? calcCourtCost(date, start, end, courts) : 0
  const hours   = (start && end) ? durationHours(start, end) : 0
  const slot    = (date && start) ? courtSlotType(date, start) : null
  const perPair = (cost > 0 && confirmedPairs > 0) ? Math.ceil(cost / confirmedPairs) : 0

  // Sync num_courts when confirmed pairs change recommendation
  useEffect(() => {
    if (!initial.num_courts && recommended) setCourts(recommended)
  }, [recommended, initial.num_courts])

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="tournament_id" value={tournamentId} />

      {/* Recommended courts indicator */}
      {confirmedPairs > 0 && (
        <div className={`rounded-lg px-4 py-3 text-sm flex items-start gap-3 ${
          recommended
            ? 'bg-[#00C4CC]/10 border border-[#00C4CC]/30'
            : 'bg-amber-500/10 border border-amber-500/30'
        }`}>
          <Calculator className="h-4 w-4 mt-0.5 shrink-0 text-[#00C4CC]" />
          <div>
            {recommended ? (
              <>
                <span className="font-medium">{confirmedPairs} parejas confirmadas</span>
                {' → '}
                <span className="text-[#00C4CC] font-semibold">{recommended} canchas recomendadas</span>
              </>
            ) : (
              <>
                <span className="font-medium">{confirmedPairs} parejas</span>
                {' — fuera del rango automático (8–19). Ingresa manualmente.'}
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Fecha del torneo</label>
          <input
            name="tournament_date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Hora inicio</label>
          <input
            name="start_time"
            type="time"
            value={start}
            onChange={e => setStart(e.target.value)}
            className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Hora fin</label>
          <input
            name="end_time"
            type="time"
            value={end}
            onChange={e => setEnd(e.target.value)}
            className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Canchas a usar
          {recommended && (
            <button
              type="button"
              onClick={() => setCourts(recommended)}
              className="ml-2 text-[#00C4CC] hover:underline text-[11px]"
            >
              usar recomendado ({recommended})
            </button>
          )}
        </label>
        <input
          name="num_courts"
          type="number"
          min={1}
          max={20}
          value={courts}
          onChange={e => setCourts(Number(e.target.value))}
          className="w-32 bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Live cost breakdown */}
      {cost > 0 ? (
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cálculo en tiempo real</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Franja horaria</p>
              <p className="font-medium">{slot ? SLOT_LABELS[slot] : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Duración</p>
              <p className="font-medium">{hours % 1 === 0 ? hours : hours.toFixed(1)} h</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Canchas</p>
              <p className="font-medium">{courts}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Costo total</p>
              <p className="font-bold text-amber-400">{formatCOP(cost)}</p>
            </div>
          </div>
          {confirmedPairs > 0 && (
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Costo por pareja ({confirmedPairs} parejas)
              </span>
              <span className="text-sm font-semibold text-[#00C4CC]">{formatCOP(perPair)}</span>
            </div>
          )}
        </div>
      ) : date && start && end ? (
        <p className="text-xs text-amber-400">Verifica que la hora de fin sea posterior a la de inicio.</p>
      ) : null}

      {state?.error && (
        <p className="text-sm text-red-400 bg-red-400/10 rounded-md px-3 py-2">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-400 bg-emerald-400/10 rounded-md px-3 py-2">
          Planta física guardada correctamente.
        </p>
      )}

      <Button type="submit" disabled={pending} size="sm">
        <Save className="h-3.5 w-3.5 mr-1.5" />
        {pending ? 'Guardando…' : 'Guardar planta física'}
      </Button>
    </form>
  )
}
