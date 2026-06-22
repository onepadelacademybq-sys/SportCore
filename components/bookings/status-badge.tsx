import type { Booking } from '@/actions/bookings'

type Status = Booking['status']

const CONFIG: Record<Status, { label: string; dot: string; bg: string }> = {
  pending:   { label: 'Solicitada',  dot: 'bg-amber-400',    bg: 'bg-amber-500/15 text-amber-400' },
  paid:      { label: 'Pagada',      dot: 'bg-blue-400',     bg: 'bg-blue-500/15 text-blue-400' },
  confirmed: { label: 'Confirmada',  dot: 'bg-brand',    bg: 'bg-brand/15 text-brand' },
  cancelled: { label: 'Cancelada',   dot: 'bg-red-400',      bg: 'bg-red-500/15 text-red-400' },
  completed: { label: 'Completada',  dot: 'bg-muted-foreground', bg: 'bg-muted text-muted-foreground' },
  no_show:   { label: 'No asistió',  dot: 'bg-orange-400',   bg: 'bg-orange-500/15 text-orange-400' },
}

export function StatusBadge({ status }: { status: Status }) {
  const cfg = CONFIG[status] ?? CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
