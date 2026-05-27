'use client'

import { useActionState, useState } from 'react'
import { createTournamentAction } from '@/actions/tournaments'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'

const FORMATS = [
  { value: 'eliminatoria', label: 'Eliminación directa' },
  { value: 'grupos', label: 'Fase de grupos (round-robin)' },
  { value: 'grupos_y_eliminatoria', label: 'Grupos + eliminación' },
]

const CATEGORIES = [
  '5ta Masculino', '6ta Masculino', '7ma Masculino',
  'Femenino C', 'Femenino D',
  'Sub-18', 'Sub-16', 'Sub-14',
  'Prejuvenil', 'Baby Pádel', 'Mixto',
]

export function CreateTournamentDialog() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(createTournamentAction, null)

  if (state?.success && open) setOpen(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1.5" />
        Nuevo torneo
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-base font-semibold">Nuevo torneo</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={action} className="p-5 space-y-4">
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
                    className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Seleccionar…</option>
                    {FORMATS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Categoría *</label>
                  <select
                    name="category"
                    required
                    className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Seleccionar…</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Fecha inicio *</label>
                  <input
                    name="start_date"
                    type="date"
                    required
                    className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Fecha fin *</label>
                  <input
                    name="end_date"
                    type="date"
                    required
                    className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
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
                    placeholder="Sin límite"
                    className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Inscripción ($)</label>
                  <input
                    name="entry_fee"
                    type="number"
                    min={0}
                    defaultValue={0}
                    className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Modalidad de inscripción</label>
                <select
                  name="requires_partner"
                  className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="true">Por pareja (jugador + compañero)</option>
                  <option value="false">Individual (el admin forma las parejas)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Información adicional, premios, reglas…"
                  className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
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
