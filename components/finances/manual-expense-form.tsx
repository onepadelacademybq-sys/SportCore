'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { createManualExpense } from '@/actions/finances'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BankAccount } from '@/actions/finances'

export function ManualExpenseForm({ accounts }: { accounts: BankAccount[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, action, isPending] = useActionState(createManualExpense, { error: null })
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (state.success) {
      setOpen(false)
      router.refresh()
    }
  }, [state.success, router])

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Registrar egreso manual
      </Button>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Nuevo egreso manual</h3>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {state.error && <p className="text-xs text-destructive mb-2">{state.error}</p>}

      <form action={action} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="me-amount" className="text-xs">Monto</Label>
          <Input id="me-amount" name="amount" type="number" min={1} step="1" placeholder="0" disabled={isPending} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="me-date" className="text-xs">Fecha</Label>
          <Input id="me-date" name="date" type="date" defaultValue={today} disabled={isPending} required />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="me-desc" className="text-xs">Descripción</Label>
          <Input id="me-desc" name="description" placeholder="Ej: compra de paletas, pelotas…" disabled={isPending} required />
        </div>
        {accounts.length > 0 && (
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="me-account" className="text-xs">Cuenta (opcional)</Label>
            <select
              id="me-account"
              name="bankAccountId"
              disabled={isPending}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground"
            >
              <option value="">Sin cuenta asociada</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} · {a.bank_name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="sm:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? 'Guardando…' : 'Guardar egreso'}
          </Button>
        </div>
      </form>
    </div>
  )
}
