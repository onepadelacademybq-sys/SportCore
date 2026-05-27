'use client'

import { useTransition } from 'react'
import { confirmEntryAction, rejectEntryAction } from '@/actions/tournaments'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

export function ConfirmEntryButton({ entryId }: { entryId: string }) {
  const [pending, start] = useTransition()
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      className="h-7 px-2 text-emerald-400 border-emerald-400/40 hover:bg-emerald-400/10"
      onClick={() => start(async () => { await confirmEntryAction(entryId) })}
    >
      <Check className="h-3.5 w-3.5 mr-1" />
      {pending ? '…' : 'Confirmar'}
    </Button>
  )
}

export function RejectEntryButton({ entryId }: { entryId: string }) {
  const [pending, start] = useTransition()
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      className="h-7 px-2 text-red-400 border-red-400/40 hover:bg-red-400/10"
      onClick={() => start(async () => { await rejectEntryAction(entryId) })}
    >
      <X className="h-3.5 w-3.5 mr-1" />
      {pending ? '…' : 'Rechazar'}
    </Button>
  )
}
