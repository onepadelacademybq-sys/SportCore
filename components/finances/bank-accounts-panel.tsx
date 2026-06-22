'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, X } from 'lucide-react'
import {
  createBankAccountAction,
  updateBankAccountAction,
  setBankAccountActiveAction,
} from '@/actions/finances'
import { formatCOP } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { BankAccount, FinanceActionState } from '@/actions/finances'

const ACCOUNT_TYPE_LABEL = { ahorros: 'Ahorros', corriente: 'Corriente' } as const

export function BankAccountsPanel({ accounts }: { accounts: BankAccount[] }) {
  const [creating, setCreating] = useState(false)
  const total = accounts.filter((a) => a.is_active).reduce((s, a) => s + a.current_balance, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm">
          Saldo total (cuentas activas):{' '}
          <span className="font-bold tabular-nums text-brand">{formatCOP(total)}</span>
        </p>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Nueva cuenta
          </Button>
        )}
      </div>

      {creating && (
        <AccountForm
          mode="create"
          onClose={() => setCreating(false)}
        />
      )}

      {accounts.length === 0 && !creating ? (
        <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
          Aún no hay cuentas registradas.
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((a) => (
            <AccountRow key={a.id} account={a} />
          ))}
        </div>
      )}
    </div>
  )
}

function AccountRow({ account }: { account: BankAccount }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [toggleState, toggleAction, togglePending] = useActionState(setBankAccountActiveAction, { error: null } as FinanceActionState)

  useEffect(() => {
    if (toggleState.success) router.refresh()
  }, [toggleState.success, router])

  if (editing) {
    return <AccountForm mode="edit" account={account} onClose={() => setEditing(false)} />
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{account.name}</p>
          <Badge variant="outline" className="text-[10px]">{ACCOUNT_TYPE_LABEL[account.account_type]}</Badge>
          {!account.is_active && <Badge variant="secondary" className="text-[10px]">Inactiva</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          {account.bank_name}
          {account.account_number && ` ····${account.account_number}`} · {account.currency}
        </p>
      </div>
      <p className="text-base font-bold tabular-nums shrink-0">{formatCOP(account.current_balance)}</p>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)} title="Editar">
          <Pencil className="h-4 w-4" />
        </Button>
        <form action={toggleAction}>
          <input type="hidden" name="id" value={account.id} />
          <input type="hidden" name="isActive" value={(!account.is_active).toString()} />
          <Button type="submit" variant="outline" size="sm" disabled={togglePending} className="text-xs">
            {account.is_active ? 'Desactivar' : 'Activar'}
          </Button>
        </form>
      </div>
    </div>
  )
}

function AccountForm({
  mode, account, onClose,
}: {
  mode: 'create' | 'edit'
  account?: BankAccount
  onClose: () => void
}) {
  const router = useRouter()
  const submitAction = mode === 'create' ? createBankAccountAction : updateBankAccountAction
  const [state, action, isPending] = useActionState(submitAction, { error: null } as FinanceActionState)

  useEffect(() => {
    if (state.success) {
      onClose()
      router.refresh()
    }
  }, [state.success, onClose, router])

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{mode === 'create' ? 'Nueva cuenta bancaria' : 'Editar cuenta'}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {state.error && <p className="text-xs text-destructive mb-2">{state.error}</p>}

      <form action={action} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {mode === 'edit' && <input type="hidden" name="id" value={account!.id} />}

        <div className="space-y-1">
          <Label htmlFor="ba-name" className="text-xs">Nombre / alias</Label>
          <Input id="ba-name" name="name" defaultValue={account?.name} placeholder="Cuenta principal" disabled={isPending} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ba-bank" className="text-xs">Banco</Label>
          <Input id="ba-bank" name="bankName" defaultValue={account?.bank_name} placeholder="Bancolombia" disabled={isPending} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ba-num" className="text-xs">Últimos 4 dígitos</Label>
          <Input id="ba-num" name="accountNumber" defaultValue={account?.account_number ?? ''} maxLength={4} placeholder="1234" disabled={isPending} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ba-type" className="text-xs">Tipo</Label>
          <select
            id="ba-type"
            name="accountType"
            defaultValue={account?.account_type ?? 'ahorros'}
            disabled={isPending}
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground"
          >
            <option value="ahorros">Ahorros</option>
            <option value="corriente">Corriente</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="ba-balance" className="text-xs">Saldo actual</Label>
          <Input id="ba-balance" name="currentBalance" type="number" min={0} step="1" defaultValue={account?.current_balance ?? 0} disabled={isPending} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ba-currency" className="text-xs">Moneda</Label>
          <Input id="ba-currency" name="currency" defaultValue={account?.currency ?? 'COP'} disabled={isPending} />
        </div>

        <div className="sm:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? 'Guardando…' : mode === 'create' ? 'Crear cuenta' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}
