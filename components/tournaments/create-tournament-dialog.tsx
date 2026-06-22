'use client'

import { useActionState, useState } from 'react'
import { createTournamentAction } from '@/actions/tournaments'
import { calcCourtCost, recommendedCourts, courtSlotType, durationHours, formatCOP, SLOT_LABELS } from '@/lib/tournaments/costs'
import { Button } from '@/components/ui/button'
import { Plus, X, Calculator } from 'lucide-react'

const FORMATS = [
  {
    value: 'eliminatoria',
    label: 'Eliminación directa',
    desc: 'Torneo de llaves. El perdedor queda eliminado. Ideal para competencias con campeón único.',
    requiresPartner: true,
  },
  {
    value: 'grupos',
    label: 'Fase de grupos (round-robin)',
    desc: 'Todos juegan contra todos. Ranking final por puntos y game-difference.',
    requiresPartner: true,
  },
  {
    value: 'grupos_y_eliminatoria',
    label: 'Grupos + eliminación',
    desc: 'Fase de grupos clasificatoria seguida de cuadro de eliminación directa.',
    requiresPartner: true,
  },
  {
    value: 'americano_individual',
    label: 'Americano individual',
    desc: 'Jugadores individuales. Las parejas rotan automáticamente cada ronda. Requiere múltiplo de 4 jugadores.',
    requiresPartner: false,
  },
  {
    value: 'americano_mixto',
    label: 'Americano mixto',
    desc: 'Igual que americano individual con mezcla de géneros. Rotación aleatoria.',
    requiresPartner: false,
  },
  {
    value: 'super_8',
    label: 'Super 8',
    desc: 'Exactamente 8 jugadores. 7 rondas con calendario fijo: cada jugador es pareja de los otros 7 una vez.',
    requiresPartner: false,
  },
  {
    value: 'americano_parejas',
    label: 'Americano por parejas',
    desc: 'Parejas fijas que juegan entre sí en round-robin completo. Ranking por pareja.',
    requiresPartner: true,
  },
  {
    value: 'americano_rey_pista',
    label: 'Rey de pista',
    desc: 'Parejas fijas. Tras cada ronda las mejores parejas suben a cancha 1 y las peores bajan. El rey es quien domina la cancha 1.',
    requiresPartner: true,
  },
]

const CATEGORIES = [
  '5ta Masculino', '6ta Masculino', '7ma Masculino',
  'Femenino C', 'Femenino D',
  'Sub-18', 'Sub-16', 'Sub-14',
  'Prejuvenil', 'Baby Pádel', 'Mixto',
]

export function CreateTournamentDialog() {
  const [open, setOpen]   = useState(false)
  const [state, action, pending] = useActionState(createTournamentAction, null)

  // Local state for live cost preview
  const [maxEntries, setMaxEntries] = useState('')
  const [tDate, setTDate]           = useState('')
  const [tStart, setTStart]         = useState('')
  const [tEnd, setTEnd]             = useState('')
  const [numCourts, setNumCourts]   = useState('')
  const [selectedFormat, setSelectedFormat] = useState('')
  const [requiresPartner, setRequiresPartner] = useState('true')

  if (state?.success && open) {
    setOpen(false)
    setMaxEntries(''); setTDate(''); setTStart(''); setTEnd(''); setNumCourts('')
    setSelectedFormat(''); setRequiresPartner('true')
  }

  const formatMeta = FORMATS.find(f => f.value === selectedFormat)

  const recommended = maxEntries ? recommendedCourts(Number(maxEntries)) : null
  const effectiveCourts = Number(numCourts) || recommended || 0
  const cost  = (tDate && tStart && tEnd && effectiveCourts > 0)
    ? calcCourtCost(tDate, tStart, tEnd, effectiveCourts) : 0
  const hours = (tStart && tEnd) ? durationHours(tStart, tEnd) : 0
  const slot  = (tDate && tStart) ? courtSlotType(tDate, tStart) : null

  function handleFormatChange(val: string) {
    setSelectedFormat(val)
    const meta = FORMATS.find(f => f.value === val)
    if (meta) setRequiresPartner(meta.requiresPartner ? 'true' : 'false')
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1.5" />
        Nuevo torneo
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-card z-10">
              <h2 className="text-base font-semibold">Nuevo torneo</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={action} className="p-5 space-y-5">

              {/* ── Información general ─────────────────────────────────── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Información general</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Nombre *</label>
                    <input
                      name="name"
                      required
                      placeholder="ej. Torneo Apertura 2026"
                      className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Formato *</label>
                      <select
                        name="format"
                        required
                        value={selectedFormat}
                        onChange={e => handleFormatChange(e.target.value)}
                        className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Seleccionar…</option>
                        <optgroup label="Clásico">
                          {FORMATS.filter(f => ['eliminatoria','grupos','grupos_y_eliminatoria'].includes(f.value))
                            .map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </optgroup>
                        <optgroup label="Americano">
                          {FORMATS.filter(f => !['eliminatoria','grupos','grupos_y_eliminatoria'].includes(f.value))
                            .map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </optgroup>
                      </select>
                      {formatMeta && (
                        <p className="text-[11px] text-muted-foreground bg-muted/40 rounded-md px-2.5 py-1.5 leading-relaxed">
                          {formatMeta.desc}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Categoría *</label>
                      <select name="category" required className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Seleccionar…</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Fecha inicio *</label>
                      <input name="start_date" type="date" required className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Fecha fin *</label>
                      <input name="end_date" type="date" required className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Cupo máximo</label>
                      <input
                        name="max_entries"
                        type="number"
                        min={2}
                        max={256}
                        value={maxEntries}
                        onChange={e => setMaxEntries(e.target.value)}
                        placeholder="Sin límite"
                        className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {recommended && maxEntries && (
                        <p className="text-[11px] text-brand">→ {recommended} canchas recomendadas</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Inscripción ($)</label>
                      <input name="entry_fee" type="number" min={0} defaultValue={0} className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Modalidad de inscripción</label>
                    <select
                      name="requires_partner"
                      value={requiresPartner}
                      onChange={e => setRequiresPartner(e.target.value)}
                      className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="true">Por pareja (jugador + compañero)</option>
                      <option value="false">Individual (el admin forma las parejas)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                    <textarea name="description" rows={2} placeholder="Premios, reglas adicionales…" className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                  </div>
                </div>
              </div>

              {/* ── Planta física ───────────────────────────────────────── */}
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Planta física
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Fecha del evento</label>
                      <input
                        name="tournament_date"
                        type="date"
                        value={tDate}
                        onChange={e => setTDate(e.target.value)}
                        className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Hora inicio</label>
                      <input
                        name="start_time"
                        type="time"
                        value={tStart}
                        onChange={e => setTStart(e.target.value)}
                        className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Hora fin</label>
                      <input
                        name="end_time"
                        type="time"
                        value={tEnd}
                        onChange={e => setTEnd(e.target.value)}
                        className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Canchas a usar
                      {recommended && (
                        <button type="button" onClick={() => setNumCourts(String(recommended))} className="ml-2 text-brand hover:underline text-[11px]">
                          usar recomendado ({recommended})
                        </button>
                      )}
                    </label>
                    <input
                      name="num_courts"
                      type="number"
                      min={1}
                      max={20}
                      value={numCourts}
                      onChange={e => setNumCourts(e.target.value)}
                      placeholder={recommended ? `${recommended} (recomendado)` : 'Número de canchas'}
                      className="w-36 bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Live cost preview */}
                  {cost > 0 && (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                        <Calculator className="h-3.5 w-3.5" />
                        Costo estimado de cancha
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Franja</p>
                          <p className="font-medium">{slot ? SLOT_LABELS[slot] : '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duración</p>
                          <p className="font-medium">{hours % 1 === 0 ? hours : hours.toFixed(1)} h × {effectiveCourts} canchas</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-bold text-amber-400">{formatCOP(cost)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {state?.error && (
                <p className="text-sm text-red-400 bg-red-400/10 rounded-md px-3 py-2">{state.error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={pending} className="flex-1">
                  {pending ? 'Creando…' : 'Crear torneo'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
