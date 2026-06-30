export const CO_TZ = 'America/Bogota'
export const CO_OFFSET = '-05:00' // Colombia UTC-5, sin DST

/** Fecha de sesión en hora Colombia. long: "lunes, 23 de junio"; corto: "lun, 23 jun" */
export function formatSessionDate(iso: string, opts?: { long?: boolean; year?: boolean }): string {
  const long = opts?.long ?? false
  return new Intl.DateTimeFormat('es-CO', {
    weekday: long ? 'long' : 'short',
    day: 'numeric',
    month: long ? 'long' : 'short',
    ...(opts?.year && { year: 'numeric' }),
    timeZone: CO_TZ,
  }).format(new Date(iso))
}

/** Convierte un valor de <input datetime-local> (sin zona) a instante ISO en hora Colombia */
export function colombiaLocalToISO(datetimeLocal: string): string {
  // ponytail: asume precisión de minutos (datetime-local sin step); si algún día se usa step con segundos, parsear sin anexar ":00"
  return new Date(`${datetimeLocal}:00${CO_OFFSET}`).toISOString()
}

/** Hora de sesión en hora Colombia: "18:00" */
export function formatSessionTime(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: CO_TZ,
  }).format(new Date(iso))
}

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

/** Rango de hora en formato 24h, en hora Colombia: "10:00 – 11:00" */
export function formatTimeRange(startIso: string, endIso: string): string {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: CO_TZ,
    }).format(new Date(iso))
  return `${fmt(startIso)} – ${fmt(endIso)}`
}

/** Fecha y hora compacta, en hora Colombia: "lun, 23 may · 10:00 – 11:00" */
export function formatBookingDateTime(startIso: string, endIso: string): string {
  const date = new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: CO_TZ,
  }).format(new Date(startIso))
  return `${date} · ${formatTimeRange(startIso, endIso)}`
}
