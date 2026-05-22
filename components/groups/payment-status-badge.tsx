import { cn } from '@/lib/utils'

const CONFIG = {
  pending: { label: 'Pendiente', className: 'bg-amber-500/15 text-amber-400' },
  partial: { label: 'Parcial',   className: 'bg-orange-500/15 text-orange-400' },
  paid:    { label: 'Pagado',    className: 'bg-emerald-500/15 text-emerald-400' },
  overdue: { label: 'Vencido',   className: 'bg-red-500/15 text-red-400' },
} as const

type PaymentStatus = keyof typeof CONFIG

export function PaymentStatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status as PaymentStatus] ?? { label: status, className: 'bg-muted text-muted-foreground' }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', cfg.className)}>
      {cfg.label}
    </span>
  )
}
