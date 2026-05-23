import { cn } from '@/lib/utils'

const MESO_STATUS: Record<string, { label: string; className: string }> = {
  draft:     { label: 'Borrador',   className: 'bg-muted text-muted-foreground' },
  active:    { label: 'Activo',     className: 'bg-emerald-500/15 text-emerald-400' },
  completed: { label: 'Completado', className: 'bg-blue-500/15 text-blue-400' },
  archived:  { label: 'Archivado',  className: 'bg-zinc-500/15 text-zinc-400' },
}

const SESSION_STATUS: Record<string, { label: string; className: string }> = {
  scheduled: { label: 'Programada',  className: 'bg-amber-500/15 text-amber-400' },
  completed: { label: 'Completada',  className: 'bg-emerald-500/15 text-emerald-400' },
  cancelled: { label: 'Cancelada',   className: 'bg-red-500/15 text-red-400' },
}

const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium'

export function MesoStatusBadge({ status }: { status: string }) {
  const cfg = MESO_STATUS[status] ?? { label: status, className: 'bg-muted text-muted-foreground' }
  return <span className={cn(base, cfg.className)}>{cfg.label}</span>
}

export function SessionStatusBadge({ status }: { status: string }) {
  const cfg = SESSION_STATUS[status] ?? { label: status, className: 'bg-muted text-muted-foreground' }
  return <span className={cn(base, cfg.className)}>{cfg.label}</span>
}
