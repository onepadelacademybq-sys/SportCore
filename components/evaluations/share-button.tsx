'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { shareEvaluation } from '@/actions/evaluations'

interface Props {
  evaluationId: string
  isShared:     boolean
}

export function ShareButton({ evaluationId, isShared: initial }: Props) {
  const [isShared, setIsShared] = useState(initial)
  const [pending,  setPending]  = useState(false)

  async function toggle() {
    setPending(true)
    await shareEvaluation(evaluationId, !isShared)
    setIsShared((v) => !v)
    setPending(false)
  }

  return (
    <Button
      type="button"
      variant={isShared ? 'default' : 'outline'}
      size="sm"
      onClick={toggle}
      disabled={pending}
      className="gap-2"
    >
      {isShared ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      {isShared ? 'Compartida con jugador' : 'Compartir con jugador'}
    </Button>
  )
}
