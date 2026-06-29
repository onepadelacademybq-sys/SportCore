'use client'

import { useState } from 'react'
import { setMesocycleObjectiveAction, type TrainingObjective } from '@/actions/training'
import { Button } from '@/components/ui/button'

const NEW = '__new__'

const THEMES = [
  { value: 'tecnica',           label: 'Técnica' },
  { value: 'tactica',           label: 'Táctica' },
  { value: 'fisico',            label: 'Físico' },
  { value: 'mental',            label: 'Mental' },
  { value: 'calentamiento',     label: 'Calentamiento' },
  { value: 'vuelta_a_la_calma', label: 'Vuelta a la calma' },
]

const fieldClass =
  'rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

interface Props {
  mesocycleId: string
  objectives: TrainingObjective[]
  currentObjectiveId: string | null
}

export function MesocycleObjectiveForm({ mesocycleId, objectives, currentObjectiveId }: Props) {
  const [sel, setSel] = useState(currentObjectiveId ?? '')

  return (
    <form action={setMesocycleObjectiveAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="mesocycleId" value={mesocycleId} />

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Objetivo del mesociclo</label>
        <select name="objectiveId" value={sel} onChange={(e) => setSel(e.target.value)} className={`${fieldClass} min-w-52`}>
          <option value="">— Sin objetivo —</option>
          {objectives.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
          <option value={NEW}>+ Otro (crear nuevo)</option>
        </select>
      </div>

      {sel === NEW && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Nuevo objetivo</label>
            <input name="newObjectiveName" required className={`${fieldClass} w-48`} placeholder="Nombre del objetivo" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Tema</label>
            <select name="newObjectiveTheme" className={fieldClass}>
              {THEMES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </>
      )}

      <Button type="submit" variant="outline" size="sm">Guardar objetivo</Button>
    </form>
  )
}
