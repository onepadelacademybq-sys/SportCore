import { Badge } from '@/components/ui/badge'

const CONFIG = {
  active: { label: 'Activo',  className: 'bg-brand/15 text-brand' },
  paused: { label: 'Pausado', className: 'bg-amber-500/15 text-amber-400' },
  closed: { label: 'Cerrado', className: 'bg-muted text-muted-foreground' },
} as const

type Status = keyof typeof CONFIG

export function GroupStatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status as Status] ?? { label: status, className: 'bg-muted text-muted-foreground' }
  return <Badge className={cfg.className}>{cfg.label}</Badge>
}
