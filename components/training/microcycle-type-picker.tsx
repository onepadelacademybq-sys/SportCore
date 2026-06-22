'use client'

import { useActionState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { TrainingState } from '@/actions/training'
import { MICROCYCLE_TYPES } from '@/lib/planning-templates'

type FormAction = (prev: TrainingState, formData: FormData) => Promise<TrainingState>

interface Props {
  microcycleId:    string
  currentObjective: string | null
  action:          FormAction
}

export function MicrocycleTypePicker({ microcycleId, currentObjective, action }: Props) {
  const [state, formAction, isPending] = useActionState(action, { error: null })

  return (
    <div className="space-y-3">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert className="border-brand/30 bg-brand/10">
          <AlertDescription className="text-brand">{state.success}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-2">
        {MICROCYCLE_TYPES.map((type) => {
          const isSelected = currentObjective === type.focus
          return (
            <form key={type.id} action={formAction}>
              <input type="hidden" name="microcycleId" value={microcycleId} />
              <input type="hidden" name="weeklyObjective" value={type.focus} />
              <button
                type="submit"
                disabled={isPending || isSelected}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors text-sm ${
                  isSelected
                    ? 'border-primary bg-primary/10 cursor-default'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="font-medium">{type.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{type.focus}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{type.description}</div>
              </button>
            </form>
          )
        })}
      </div>
    </div>
  )
}
