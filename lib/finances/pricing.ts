// Cálculos puros del módulo de finanzas: costo de cancha y pago al entrenador.
// Sin efectos secundarios — testeable de forma aislada.

/** Costo operativo de la cancha por hora (COP). */
export const COURT_HOURLY_COST = 70_000

/** Colombia es UTC-5 sin DST. Todas las clasificaciones de día/hora se hacen en hora local CO. */
const CO_OFFSET_MS = -5 * 60 * 60 * 1000

export type CoachRates = {
  am: number      // L-V 5:00–15:59
  pm: number      // L-V 16:00 en adelante
  weekend: number // Sáb-Dom, cualquier hora
}

export const DEFAULT_COACH_RATES: CoachRates = { am: 35_000, pm: 70_000, weekend: 60_000 }

/** Hora local (0–23) a la que cambia la tarifa de día de semana: 16:00. */
const PM_BOUNDARY_HOUR = 16

/** Horas decimales entre dos instantes (nunca negativo). */
export function hoursBetween(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / 3_600_000)
}

/** Costo de cancha = horas × tarifa por hora, redondeado a peso. */
export function courtCost(start: Date, end: Date): number {
  return Math.round(hoursBetween(start, end) * COURT_HOURLY_COST)
}

/**
 * Pago al entrenador, prorrateado por franja horaria usando las tarifas del coach.
 * Bandas (hora local, consistente con cómo se crean las reservas):
 *   - Fin de semana (sáb/dom): tarifa weekend, plana.
 *   - Día de semana antes de las 16:00: tarifa am.
 *   - Día de semana 16:00 en adelante: tarifa pm.
 * Una reserva de día de semana que cruza las 16:00 se prorratea entre am y pm.
 */
export function coachPayment(start: Date, end: Date, rates: CoachRates): number {
  if (end <= start) return 0

  // Convertir a hora local Colombia para que getDay/getHours reflejen el día real del jugador.
  // Sin esto, en Vercel (UTC) un domingo 23:00 CO se almacena como lunes 04:00 UTC y se cobra
  // tarifa de día laboral cuando debería ser weekend.
  const startCO = new Date(start.getTime() + CO_OFFSET_MS)

  const day = startCO.getUTCDay() // 0=Dom … 6=Sáb en hora Colombia
  if (day === 0 || day === 6) {
    return Math.round(hoursBetween(start, end) * rates.weekend)
  }

  // 16:00 CO = 21:00 UTC → construir boundary en UTC
  const boundaryCO = new Date(startCO)
  boundaryCO.setUTCHours(PM_BOUNDARY_HOUR, 0, 0, 0)
  const boundary = new Date(boundaryCO.getTime() - CO_OFFSET_MS)

  if (end <= boundary) return Math.round(hoursBetween(start, end) * rates.am)
  if (start >= boundary) return Math.round(hoursBetween(start, end) * rates.pm)

  // Cruza las 16:00 CO → prorratear
  const amHours = hoursBetween(start, boundary)
  const pmHours = hoursBetween(boundary, end)
  return Math.round(amHours * rates.am + pmHours * rates.pm)
}
