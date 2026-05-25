'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRole, setUserActive } from '@/actions/users'
import { Button } from '@/components/ui/button'
import type { UserRole } from '@/actions/users'

interface Props {
  userId: string
  currentRole: UserRole
  isActive: boolean
}

export function UserActions({ userId, currentRole, isActive }: Props) {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>(currentRole)
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ error: string | null; success?: string } | null>(null)

  function applyRole() {
    if (role === currentRole) return
    startTransition(async () => {
      const res = await updateUserRole(userId, role)
      setMsg(res)
      if (!res.error) router.refresh()
    })
  }

  function toggleActive() {
    startTransition(async () => {
      const res = await setUserActive(userId, !isActive)
      setMsg(res)
      if (!res.error) router.refresh()
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <h3 className="text-sm font-semibold">Acciones de administrador</h3>

      {msg?.error && <p className="text-xs text-destructive">{msg.error}</p>}
      {msg?.success && <p className="text-xs text-[#00C4CC]">{msg.success}</p>}

      {/* Cambiar rol */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Rol</label>
        <div className="flex items-center gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={pending}
            className="h-9 flex-1 rounded-md border border-border bg-background px-2 text-sm text-foreground"
          >
            <option value="player">Jugador</option>
            <option value="coach">Entrenador</option>
            <option value="admin">Administrador</option>
          </select>
          <Button size="sm" onClick={applyRole} disabled={pending || role === currentRole}>
            {pending ? '…' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Activar / desactivar */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Estado de la cuenta</label>
        <Button
          variant={isActive ? 'destructive' : 'default'}
          size="sm"
          onClick={toggleActive}
          disabled={pending}
          className="w-full"
        >
          {pending ? '…' : isActive ? 'Desactivar cuenta' : 'Activar cuenta'}
        </Button>
      </div>
    </div>
  )
}
