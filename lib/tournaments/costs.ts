// Court cost calculation for tournaments

export const COURT_RATES = {
  am:      35_000,   // Lun–Vie 05:00–15:59
  pm:      70_000,   // Lun–Vie 16:00–23:59
  weekend: 60_000,   // Sáb–Dom todo el día
} as const

export type SlotType = keyof typeof COURT_RATES

/** Determine slot type from ISO date string + "HH:MM" start time */
export function courtSlotType(tournamentDate: string, startTime: string): SlotType {
  // Parse date in local context — date-only strings avoid timezone shift
  const [year, month, day] = tournamentDate.split('-').map(Number)
  const dow = new Date(year, month - 1, day).getDay() // 0=Sun, 6=Sat
  if (dow === 0 || dow === 6) return 'weekend'
  const hour = Number(startTime.split(':')[0])
  return hour < 16 ? 'am' : 'pm'
}

export function courtRatePerHour(tournamentDate: string, startTime: string): number {
  return COURT_RATES[courtSlotType(tournamentDate, startTime)]
}

/** Duration in hours between two "HH:MM" strings */
export function durationHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  return (eh * 60 + em - (sh * 60 + sm)) / 60
}

/** Total court cost: courts × hours × rate */
export function calcCourtCost(
  tournamentDate: string,
  startTime: string,
  endTime: string,
  numCourts: number,
): number {
  if (!tournamentDate || !startTime || !endTime || numCourts <= 0) return 0
  const hours = durationHours(startTime, endTime)
  if (hours <= 0) return 0
  return numCourts * hours * courtRatePerHour(tournamentDate, startTime)
}

/** Courts recommended by confirmed-pairs rule */
export function recommendedCourts(confirmedPairs: number): number | null {
  if (confirmedPairs >= 8  && confirmedPairs <= 11) return 2
  if (confirmedPairs >= 12 && confirmedPairs <= 15) return 3
  if (confirmedPairs >= 16 && confirmedPairs <= 19) return 4
  return null
}

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(amount)
}

export const SLOT_LABELS: Record<SlotType, string> = {
  am:      'Lun–Vie AM ($35.000/h)',
  pm:      'Lun–Vie PM ($70.000/h)',
  weekend: 'Sáb–Dom ($60.000/h)',
}
