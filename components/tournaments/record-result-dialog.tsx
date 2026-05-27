'use client'

import { useActionState, useState } from 'react'
import { recordMatchResultAction } from '@/actions/tournaments'
import { Button } from '@/components/ui/button'
import { ClipboardEdit, X } from 'lucide-react'

interface Entry {
  id: string
  label: string
}

interface Props {
  matchId: string
  entry1: Entry
  entry2: Entry | null
}

export function RecordResultDialog({ matchId, entry1, entry2 }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(recordMatchResultAction, null)

  if (state?.success && open) setOpen(false)

  if (!entry2) return null // bye match — no result to record

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-2 text-xs"
        onClick={() => setOpen(true)}
      >
        <ClipboardEdit className="h-3 w-3 mr-1" />
        Resultado
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-sm font-semibold">Registrar resultado</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={action} className="p-4 space-y-4">
              <input type="hidden" name="match_id" value={matchId} />

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium w-36 truncate" title={entry1.label}>{entry1.label}</p>
                  <input
                    name="score_entry1"
                    placeholder="ej. 6-4 6-2"
                    className="flex-1 bg-background border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium w-36 truncate" title={entry2.label}>{entry2.label}</p>
                  <input
                    name="score_entry2"
                    placeholder="ej. 4-6 2-6"
                    className="flex-1 bg-background border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Ganador *</label>
                <select
                  name="winner_entry_id"
                  required
                  className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Seleccionar ganador…</option>
                  <option value={entry1.id}>{entry1.label}</option>
                  <option value={entry2.id}>{entry2.label}</option>
                </select>
              </div>

              {state?.error && (
                <p className="text-sm text-red-400 bg-red-400/10 rounded-md px-3 py-2">{state.error}</p>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={pending} className="flex-1" size="sm">
                  {pending ? 'Guardando…' : 'Guardar resultado'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
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
