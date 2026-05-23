'use client'

import { useActionState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteExerciseAction } from '@/actions/exercises'
import { Button } from '@/components/ui/button'

interface Props {
  exerciseId: string
  exerciseName: string
}

export function DeleteButton({ exerciseId, exerciseName }: Props) {
  const [state, action, isPending] = useActionState(deleteExerciseAction, { error: null })

  return (
    <div>
      {state.error && <p className="text-xs text-destructive mb-1">{state.error}</p>}
      <form action={action}>
        <input type="hidden" name="exerciseId" value={exerciseId} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={isPending}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
          onClick={(e) => {
            if (!confirm(`¿Eliminar "${exerciseName}"? Esta acción no se puede deshacer.`)) {
              e.preventDefault()
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {isPending ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </form>
    </div>
  )
}
