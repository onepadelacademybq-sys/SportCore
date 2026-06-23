import { Badge } from '@/components/ui/badge'

const CONFIG = {
  pending: { label: 'Pendiente', className: 'bg-amber-500/15 text-amber-400' },
  partial: { label: 'Parcial',   className: 'bg-orange-500/15 text-orange-400' },
  paid:    { label: 'Pagado',    className: 'bg-emerald-500/15 text-emerald-400' },
  overdue: { label: 'Vencido',   className: 'bg-red-500/15 text-red-400' },
} as const

type PaymentStatus = keyof typeof CONFIG

export function PaymentStatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status as PaymentStatus] ?? { label: status, className: 'bg-muted text-muted-foreground' }
  return <Badge className={cfg.className}>{cfg.label}</Badge>
}
