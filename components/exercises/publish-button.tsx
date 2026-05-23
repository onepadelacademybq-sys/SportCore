'use client'

import { useActionState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { togglePublishAction } from '@/actions/exercises'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  exerciseId: string
  isPublished: boolean
}

export function PublishButton({ exerciseId, isPublished }: Props) {
  const [state, action, isPending] = useActionState(togglePublishAction, { error: null })

  return (
    <div className="space-y-1">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <form action={action}>
        <input type="hidden" name="exerciseId" value={exerciseId} />
        <Button type="submit" variant="outline" size="sm" disabled={isPending} className="gap-2">
          {isPublished ? (
            <><EyeOff className="h-3.5 w-3.5" /> Despublicar</>
          ) : (
            <><Eye className="h-3.5 w-3.5" /> Publicar</>
          )}
        </Button>
      </form>
    </div>
  )
}
