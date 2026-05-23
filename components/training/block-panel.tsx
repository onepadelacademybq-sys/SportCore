'use client'

import { useActionState, useState } from 'react'
import { Search, X, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  addExerciseToBlockAction,
  removeExerciseFromBlockAction,
  updateBlockNotesAction,
} from '@/actions/training'
import type { SessionBlock } from '@/actions/training'

const BLOCK_LABELS: Record<string, { title: string; number: string; color: string }> = {
  calentamiento:     { number: '1', title: 'Calentamiento',    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  central:           { number: '2', title: 'Central',          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  vuelta_a_la_calma: { number: '3', title: 'Vuelta a la calma', color: 'text-[#00C4CC] bg-[#00C4CC]/10 border-[#00C4CC]/20' },
}

interface AvailableExercise {
  id: string
  name: string
  theme: string
  estimated_duration_min: number
  objective: string
}

interface Props {
  block: SessionBlock
  availableExercises: AvailableExercise[]
  readOnly?: boolean
}

function RemoveExerciseButton({ blockExerciseId }: { blockExerciseId: string }) {
  const [, action, isPending] = useActionState(removeExerciseFromBlockAction, { error: null })
  return (
    <form action={action}>
      <input type="hidden" name="blockExerciseId" value={blockExerciseId} />
      <button
        type="submit"
        disabled={isPending}
        title="Quitar ejercicio"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </form>
  )
}

function AddExercisePicker({
  blockId,
  availableExercises,
  existingIds,
}: {
  blockId: string
  availableExercises: AvailableExercise[]
  existingIds: Set<string>
}) {
  const [state, formAction, isPending] = useActionState(addExerciseToBlockAction, { error: null })
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = availableExercises.filter(
    (e) =>
      !existingIds.has(e.id) &&
      (search === '' || e.name.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-sm text-[#00C4CC] hover:text-[#00C4CC]/80 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar ejercicio
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="rounded-lg border border-border bg-card p-3 space-y-2">
          {state.error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ejercicio…"
              className="w-full rounded-md border border-border bg-input pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              {availableExercises.length === 0
                ? 'No hay ejercicios disponibles para este bloque'
                : 'No se encontraron ejercicios'}
            </p>
          ) : (
            <ul className="max-h-48 overflow-y-auto space-y-0.5">
              {filtered.map((ex) => (
                <li key={ex.id}>
                  <form action={formAction}>
                    <input type="hidden" name="blockId" value={blockId} />
                    <input type="hidden" name="exerciseId" value={ex.id} />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{ex.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{ex.estimated_duration_min} min</span>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function NotesEditor({ blockId, initialNotes }: { blockId: string; initialNotes: string | null }) {
  const [state, formAction, isPending] = useActionState(updateBlockNotesAction, { error: null })
  const [notes, setNotes] = useState(initialNotes ?? '')

  return (
    <form action={formAction} className="space-y-1.5">
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      <input type="hidden" name="blockId" value={blockId} />
      <textarea
        name="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Notas del entrenador para este bloque…"
        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <Button type="submit" variant="ghost" size="sm" disabled={isPending} className="h-7 text-xs">
        {isPending ? 'Guardando…' : 'Guardar notas'}
      </Button>
    </form>
  )
}

export function BlockPanel({ block, availableExercises, readOnly = false }: Props) {
  const cfg = BLOCK_LABELS[block.block_type] ?? {
    number: '?', title: block.block_type, color: 'text-muted-foreground bg-muted border-border',
  }

  const isCentral = block.block_type === 'central'
  const existingIds = new Set(block.exercises.map((e) => e.exercise.id))
  const totalMin = block.exercises.reduce((sum, e) => sum + (e.exercise.estimated_duration_min ?? 0), 0)

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${cfg.color}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border ${cfg.color}`}>
            {cfg.number}
          </span>
          <h3 className="font-semibold text-sm">{cfg.title}</h3>
          <span className="text-xs text-muted-foreground">{block.duration_min} min</span>
        </div>
        {isCentral && totalMin > 0 && (
          <span className="text-xs text-muted-foreground">{totalMin} min en ejercicios</span>
        )}
      </div>

      {/* Exercises — only for central block */}
      {isCentral && (
        <div className="space-y-1">
          {block.exercises.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Sin ejercicios asignados</p>
          ) : (
            <ul className="space-y-1">
              {block.exercises.map((be) => (
                <li
                  key={be.id}
                  className="group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-background/60 text-sm"
                >
                  <div className="min-w-0">
                    <span className="font-medium truncate block">{be.exercise.name}</span>
                    {be.repetitions && (
                      <span className="text-xs text-muted-foreground">{be.repetitions}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {be.exercise.estimated_duration_min} min
                    </span>
                    {!readOnly && <RemoveExerciseButton blockExerciseId={be.id} />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Notes */}
      {!readOnly && (
        <NotesEditor blockId={block.id} initialNotes={block.notes} />
      )}
      {readOnly && block.notes && (
        <p className="text-xs text-muted-foreground italic border-t border-current/20 pt-2">{block.notes}</p>
      )}

      {/* Add exercise — only for central block */}
      {!readOnly && isCentral && (
        <AddExercisePicker
          blockId={block.id}
          availableExercises={availableExercises}
          existingIds={existingIds}
        />
      )}
    </div>
  )
}
