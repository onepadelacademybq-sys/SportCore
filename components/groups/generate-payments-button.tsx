'use client'

import { useActionState } from 'react'
import { generateMonthlyPaymentsAction } from '@/actions/groups'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface Props {
  groupId: string
  year: number
  month: number
}

export function GeneratePaymentsButton({ groupId, year, month }: Props) {
  const [state, action, isPending] = useActionState(generateMonthlyPaymentsAction, { error: null })

  return (
    <div className="space-y-2">
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
      <form action={action}>
        <input type="hidden" name="groupId"     value={groupId} />
        <input type="hidden" name="periodYear"  value={year} />
        <input type="hidden" name="periodMonth" value={month} />
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          {isPending ? 'Generando...' : `Generar cobros ${month}/${year}`}
        </Button>
      </form>
    </div>
  )
}
