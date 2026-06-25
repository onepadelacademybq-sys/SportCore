'use client'

import { useActionState, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { TrainingState } from '@/actions/training'
import {
  ATHLETE_LEVELS,
  COMPETITION_TYPES,
  PERIODIZATION_MODELS,
  QUALITIES,
} from '@/lib/planning/diagnostic'

const selectClass =
  'w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

type FormAction = (prev: TrainingState, formData: FormData) => Promise<TrainingState>

interface Props {
  action: FormAction
  macrocycleId?: string
  defaultValues?: {
    name?: string
    generalObjective?: string
    startDate?: string
    endDate?: string
    athleteLevel?: string
    competitionType?: string
    periodizationModel?: string
    qualities?: string[]
  }
}

export function MacrocycleForm({ action, macrocycleId, defaultValues }: Props) {
  const [state, formAction, isPending] = useActionState(action, { error: null })
  const [qualities, setQualities] = useState<string[]>(defaultValues?.qualities ?? [])

  function toggleQuality(value: string) {
    setQualities((prev) =>
      prev.includes(value) ? prev.filter((q) => q !== value) : [...prev, value],
    )
  }

  if (state.success) {
    return (
      <Alert className="border-brand/30 bg-brand/10">
        <AlertDescription className="text-brand">{state.success}</AlertDescription>
      </Alert>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {macrocycleId && <input type="hidden" name="macrocycleId" value={macrocycleId} />}
      {qualities.map((q) => (
        <input key={q} type="hidden" name="qualities" value={q} />
      ))}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre del macrociclo</Label>
        <Input
          id="name" name="name" required disabled={isPending}
          defaultValue={defaultValues?.name}
          placeholder="Ej. Temporada 2026"
        />
      </div>

      {/* Diagnóstico inicial */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="athleteLevel">Nivel del deportista</Label>
          <select id="athleteLevel" name="athleteLevel" disabled={isPending} defaultValue={defaultValues?.athleteLevel ?? ''} className={selectClass}>
            <option value="">—</option>
            {ATHLETE_LEVELS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="competitionType">Competición</Label>
          <select id="competitionType" name="competitionType" disabled={isPending} defaultValue={defaultValues?.competitionType ?? ''} className={selectClass}>
            <option value="">—</option>
            {COMPETITION_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="periodizationModel">Modelo de periodización</Label>
          <select id="periodizationModel" name="periodizationModel" disabled={isPending} defaultValue={defaultValues?.periodizationModel ?? ''} className={selectClass}>
            <option value="">—</option>
            {PERIODIZATION_MODELS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Cualidades a trabajar */}
      <div className="space-y-2">
        <Label>Cualidades a trabajar</Label>
        <div className="flex flex-wrap gap-2">
          {QUALITIES.map((q) => {
            const on = qualities.includes(q.value)
            return (
              <button
                key={q.value}
                type="button"
                onClick={() => toggleQuality(q.value)}
                disabled={isPending}
                className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  on
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                }`}
              >
                {q.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="generalObjective">Objetivo general (opcional)</Label>
        <Textarea
          id="generalObjective" name="generalObjective" rows={2} disabled={isPending}
          defaultValue={defaultValues?.generalObjective}
          placeholder="Meta de la temporada (competitiva, desarrollo, etc.)"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Inicio (opcional)</Label>
          <Input id="startDate" name="startDate" type="date" disabled={isPending} defaultValue={defaultValues?.startDate ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Fin (opcional)</Label>
          <Input id="endDate" name="endDate" type="date" disabled={isPending} defaultValue={defaultValues?.endDate ?? ''} />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? 'Guardando...' : macrocycleId ? 'Guardar cambios' : 'Crear macrociclo'}
      </Button>
    </form>
  )
}
