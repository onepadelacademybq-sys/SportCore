/** Pesos colombianos sin decimales: "$ 35.000" */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Formato de fecha corta en español: "lun, 23 may" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d)
}

/** Rango de hora en formato 24h: "10:00 – 11:00" */
export function formatTimeRange(startIso: string, endIso: string): string {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso))
  return `${fmt(startIso)} – ${fmt(endIso)}`
}

/** Fecha y hora compacta: "lun, 23 may · 10:00 – 11:00" */
export function formatBookingDateTime(startIso: string, endIso: string): string {
  return `${formatDate(startIso)} · ${formatTimeRange(startIso, endIso)}`
}
