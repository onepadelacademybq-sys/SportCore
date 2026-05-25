import { cn } from '@/lib/utils'
import type { UserRole } from '@/actions/users'

const CONFIG: Record<UserRole, { label: string; className: string }> = {
  admin:  { label: 'Administrador', className: 'bg-red-500/15 text-red-400' },
  coach:  { label: 'Entrenador',    className: 'bg-blue-500/15 text-blue-400' },
  player: { label: 'Jugador',       className: 'bg-[#00C4CC]/15 text-[#00C4CC]' },
}

export function RoleBadge({ role }: { role: UserRole }) {
  const cfg = CONFIG[role] ?? { label: role, className: 'bg-muted text-muted-foreground' }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', cfg.className)}>
      {cfg.label}
    </span>
  )
}
