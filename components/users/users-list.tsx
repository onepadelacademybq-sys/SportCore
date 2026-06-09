'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { RoleBadge } from './role-badge'
import type { UserListItem, UserRole } from '@/actions/users'

const ROLE_TABS: { id: 'all' | UserRole; label: string }[] = [
  { id: 'all',    label: 'Todos' },
  { id: 'admin',  label: 'Admins' },
  { id: 'coach',  label: 'Entrenadores' },
  { id: 'player', label: 'Jugadores' },
]

export function UsersList({ users }: { users: UserListItem[] }) {
  const [role, setRole] = useState<'all' | UserRole>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (role !== 'all' && u.role !== role) return false
      if (q && !u.full_name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
      return true
    })
  }, [users, role, search])

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {ROLE_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setRole(t.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                role === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="h-9 w-64 rounded-md border border-border bg-background pl-8 pr-2 text-sm text-foreground"
          />
        </div>
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
          No se encontraron usuarios.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <div className="min-w-[540px]">
          <div
            className="grid text-[10px] font-semibold text-muted-foreground uppercase tracking-wide bg-muted/30 px-4 py-2"
            style={{ gridTemplateColumns: '1fr 130px 110px 90px' }}
          >
            <span>Usuario</span>
            <span>Rol</span>
            <span>Registro</span>
            <span className="text-center">Estado</span>
          </div>
          {filtered.map((u) => (
            <Link
              key={u.id}
              href={`/admin/users/${u.id}`}
              className="grid px-4 py-3 border-t border-border items-center hover:bg-muted/40 transition-colors"
              style={{ gridTemplateColumns: '1fr 130px 110px 90px' }}
            >
              <div className="min-w-0 pr-3">
                <p className="text-sm font-medium truncate">{u.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <span><RoleBadge role={u.role} /></span>
              <span className="text-xs text-muted-foreground">{formatDate(u.created_at)}</span>
              <span className="flex justify-center">
                {u.is_active ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500">
                    <span className="size-1.5 rounded-full bg-emerald-500" /> Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-muted-foreground" /> Inactivo
                  </span>
                )}
              </span>
            </Link>
          ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{filtered.length} de {users.length} usuarios</p>
    </div>
  )
}
