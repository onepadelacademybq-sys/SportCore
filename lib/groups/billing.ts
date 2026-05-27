const MS_PER_DAY = 1000 * 60 * 60 * 24
const MORA_PCT   = 10
const MORA_GRACE_DAYS = 4    // días tras el vencimiento antes de aplicar mora
const WARN_DAYS  = 2         // días antes del vencimiento para mostrar banner

export type BillingCalc = {
  fee:           number    // tarifa base sin mora
  amount:        number    // monto a pagar (con mora si aplica)
  isOverdue:     boolean
  daysLate:      number    // 0 si no está vencido
  daysUntilDue:  number    // 0 si ya venció
  moraPct:       number    // 0 ó 10
  showWarning:   boolean   // true si faltan ≤ WARN_DAYS
}

export function calcBilling(member: {
  monthly_fee:       string | number | null
  next_payment_due:  string | null
}): BillingCalc | null {
  if (!member.monthly_fee || !member.next_payment_due) return null

  const fee     = Number(member.monthly_fee)
  const dueDate = new Date(member.next_payment_due)
  dueDate.setHours(23, 59, 59, 999)       // fin del día de vencimiento

  const now       = new Date()
  const diffMs    = now.getTime() - dueDate.getTime()
  const daysLate  = Math.floor(diffMs / MS_PER_DAY)
  const isOverdue = daysLate > MORA_GRACE_DAYS
  const moraPct   = isOverdue ? MORA_PCT : 0
  const amount    = isOverdue ? Math.round(fee * (1 + moraPct / 100)) : fee

  const daysUntilDue = daysLate < 0
    ? Math.ceil(-diffMs / MS_PER_DAY)
    : 0

  return {
    fee,
    amount,
    isOverdue,
    daysLate:     Math.max(0, daysLate),
    daysUntilDue,
    moraPct,
    showWarning:  daysUntilDue > 0 && daysUntilDue <= WARN_DAYS,
  }
}

/** Próxima fecha de clase después de `from`, usando los horarios del grupo.
 *  Si el grupo no tiene horarios registrados, devuelve `from`. */
export function nextClassDate(
  schedules: { day_of_week: number }[],
  from: Date,
): Date {
  if (!schedules.length) return new Date(from)
  for (let i = 1; i <= 7; i++) {
    const candidate = new Date(from)
    candidate.setDate(candidate.getDate() + i)
    if (schedules.some((s) => s.day_of_week === candidate.getDay())) {
      return candidate
    }
  }
  return new Date(from)           // fallback (nunca debería llegar aquí)
}

/** Suma 1 mes a una fecha (mantiene el día; si el mes destino tiene menos días,
 *  usa el último día de ese mes). */
export function addOneMonth(date: Date): Date {
  const d = new Date(date)
  const targetMonth = d.getMonth() + 1
  d.setMonth(targetMonth)
  // Si se pasó al mes siguiente (p.ej. 31 enero → 3 marzo), retrocede
  if (d.getMonth() !== ((targetMonth) % 12)) {
    d.setDate(0)                  // último día del mes destino
  }
  return d
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
