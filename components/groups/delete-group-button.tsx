'use client'

import { useActionState } from 'react'
import { deleteGroupAction } from '@/actions/groups'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface Props {
  groupId: string
  groupName: string
}

export function DeleteGroupButton({ groupId, groupName }: Props) {
  const [state, action, isPending] = useActionState(deleteGroupAction, { error: null })

  return (
    <div className="space-y-2">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <form action={action}>
        <input type="hidden" name="groupId" value={groupId} />
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={(e) => {
            if (
              !confirm(
                `¿Eliminar el grupo "${groupName}"?\n\nEsta acción eliminará también todos los miembros, pagos y sesiones asociadas. No se puede deshacer.`,
              )
            )
              e.preventDefault()
          }}
        >
          {isPending ? 'Eliminando...' : 'Eliminar grupo'}
        </Button>
      </form>
    </div>
  )
}
