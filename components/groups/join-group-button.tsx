'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { requestGroupEnrollmentAction } from '@/actions/groups'
import { Button } from '@/components/ui/button'

interface Props {
  groupId: string
  myStatus: 'active' | 'waitlist' | 'pending_payment' | null
}

export function JoinGroupButton({ groupId, myStatus }: Props) {
  const router = useRouter()
  const [state, action, isPending] = useActionState(requestGroupEnrollmentAction, { error: null })

  useEffect(() => {
    if (state.success) router.refresh()
  }, [state.success, router])

  if (state.success) {
    return (
      <p className="text-xs text-brand font-medium">{state.success}</p>
    )
  }

  if (myStatus === 'active') {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-brand/15 text-brand">
        Inscrito
      </span>
    )
  }

  if (myStatus === 'pending_payment') {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-orange-500/15 text-orange-400">
        Pago pendiente
      </span>
    )
  }

  if (myStatus === 'waitlist') {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400">
        En lista de espera
      </span>
    )
  }

  return (
    <div className="space-y-1">
      {state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
      <form action={action}>
        <input type="hidden" name="groupId" value={groupId} />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Procesando...' : 'Inscribirse'}
        </Button>
      </form>
    </div>
  )
}
