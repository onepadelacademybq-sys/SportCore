import { describe, it, expect } from 'vitest'
import {
  hoursBetween,
  courtCost,
  coachPayment,
  COURT_HOURLY_COST,
  DEFAULT_COACH_RATES,
  type CoachRates,
} from '@/lib/finances/pricing'

// Helpers: construir fechas UTC a partir de componentes en hora Colombia (UTC-5).
// "coHour" es la hora *local* en Colombia.
function coDate(isoDate: string, coHour: number, min = 0): Date {
  // Convertir hora local CO a UTC
  return new Date(`${isoDate}T${String(coHour + 5).padStart(2, '0')}:${String(min).padStart(2, '0')}:00.000Z`)
}

const RATES: CoachRates = DEFAULT_COACH_RATES // { am: 35_000, pm: 70_000, weekend: 60_000 }

describe('hoursBetween', () => {
  it('devuelve la diferencia en horas exacta', () => {
    const start = new Date('2026-01-01T10:00:00Z')
    const end   = new Date('2026-01-01T11:30:00Z')
    expect(hoursBetween(start, end)).toBeCloseTo(1.5)
  })

  it('devuelve 0 si end <= start', () => {
    const d = new Date('2026-01-01T10:00:00Z')
    expect(hoursBetween(d, d)).toBe(0)
    expect(hoursBetween(new Date('2026-01-01T11:00:00Z'), new Date('2026-01-01T10:00:00Z'))).toBe(0)
  })
})

describe('courtCost', () => {
  it('calcula costo por hora × tarifa de cancha', () => {
    const start = new Date('2026-01-01T10:00:00Z')
    const end   = new Date('2026-01-01T11:00:00Z')
    expect(courtCost(start, end)).toBe(COURT_HOURLY_COST)
  })

  it('prorratea para reservas de 1.5 horas', () => {
    const start = new Date('2026-01-01T10:00:00Z')
    const end   = new Date('2026-01-01T11:30:00Z')
    expect(courtCost(start, end)).toBe(Math.round(1.5 * COURT_HOURLY_COST))
  })
})

describe('coachPayment — fin de semana', () => {
  // 2026-01-04 = domingo en Colombia
  it('aplica tarifa weekend en domingo CO', () => {
    const start = coDate('2026-01-04', 9)   // dom 09:00 CO = dom 14:00 UTC
    const end   = coDate('2026-01-04', 10)
    expect(coachPayment(start, end, RATES)).toBe(RATES.weekend)
  })

  it('aplica tarifa weekend en sábado CO', () => {
    // 2026-01-03 = sábado
    const start = coDate('2026-01-03', 14)
    const end   = coDate('2026-01-03', 15)
    expect(coachPayment(start, end, RATES)).toBe(RATES.weekend)
  })

  // Caso del bug original: domingo 23:00 CO = lunes 04:00 UTC
  // Sin fix de timezone se clasificaba como lunes (día laboral) y cobraba tarifa am.
  it('BUG: domingo 23:00 CO (= lunes 04:00 UTC) es weekend, no día laboral', () => {
    // 2026-01-04 dom 23:00 CO → UTC = 2026-01-05 04:00 UTC
    const start = new Date('2026-01-05T04:00:00.000Z')
    const end   = new Date('2026-01-05T05:00:00.000Z')
    expect(coachPayment(start, end, RATES)).toBe(RATES.weekend)
  })
})

describe('coachPayment — día de semana AM (< 16:00 CO)', () => {
  // 2026-01-05 = lunes
  it('aplica tarifa am para clases antes de las 16:00 CO', () => {
    const start = coDate('2026-01-05', 10)
    const end   = coDate('2026-01-05', 11)
    expect(coachPayment(start, end, RATES)).toBe(RATES.am)
  })

  it('aplica tarifa am incluso a las 15:59 CO', () => {
    const start = coDate('2026-01-05', 15)
    const end   = new Date(coDate('2026-01-05', 16).getTime() - 1000) // 15:59:59
    expect(coachPayment(start, end, RATES)).toBeGreaterThan(0)
    // Toda la reserva está en AM
    const expected = Math.round(hoursBetween(start, end) * RATES.am)
    expect(coachPayment(start, end, RATES)).toBe(expected)
  })
})

describe('coachPayment — día de semana PM (≥ 16:00 CO)', () => {
  it('aplica tarifa pm para clases desde las 16:00 CO en adelante', () => {
    const start = coDate('2026-01-05', 17)
    const end   = coDate('2026-01-05', 18)
    expect(coachPayment(start, end, RATES)).toBe(RATES.pm)
  })
})

describe('coachPayment — proration AM/PM', () => {
  it('prorratea correctamente una reserva que cruza las 16:00 CO', () => {
    // 14:00–18:00 CO → 2 horas AM + 2 horas PM
    const start    = coDate('2026-01-05', 14)
    const end      = coDate('2026-01-05', 18)
    const expected = Math.round(2 * RATES.am + 2 * RATES.pm)
    expect(coachPayment(start, end, RATES)).toBe(expected)
  })

  it('prorratea 30 min AM + 90 min PM', () => {
    // 15:30–17:00 CO
    const start    = coDate('2026-01-05', 15, 30)
    const end      = coDate('2026-01-05', 17)
    const expected = Math.round(0.5 * RATES.am + 1 * RATES.pm)
    expect(coachPayment(start, end, RATES)).toBe(expected)
  })
})

describe('coachPayment — casos límite', () => {
  it('devuelve 0 si end <= start', () => {
    const d = coDate('2026-01-05', 10)
    expect(coachPayment(d, d, RATES)).toBe(0)
  })
})
