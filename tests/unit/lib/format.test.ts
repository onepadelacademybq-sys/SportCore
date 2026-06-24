import { describe, it, expect } from 'vitest'
import { colombiaLocalToISO, formatSessionDate, formatSessionTime, formatBookingDateTime } from '@/lib/format'

// Estos tests asumen TZ=UTC (como Vercel). Bajo TZ Colombia, el código viejo buggy
// también pasaría: por eso el script de test fija TZ=UTC para que sean un guard real.

describe('colombiaLocalToISO', () => {
  it('interpreta el datetime-local como hora Colombia (UTC-5), no como UTC del runtime', () => {
    expect(colombiaLocalToISO('2026-06-24T18:00')).toBe('2026-06-24T23:00:00.000Z')
  })

  it('cruza la medianoche: 21:00 del día 24 en CO → 02:00Z del día 25', () => {
    expect(colombiaLocalToISO('2026-06-24T21:00')).toBe('2026-06-25T02:00:00.000Z')
  })
})

describe('formatSessionTime', () => {
  it('muestra la hora en Colombia, no en UTC del runtime', () => {
    // 23:00Z = 18:00 (06:00 p. m.) en Colombia
    const out = formatSessionTime('2026-06-24T23:00:00.000Z').replace(/\s+/g, ' ')
    expect(out).toContain('06:00')
    expect(out).toMatch(/p\.?\s?m\.?/i)
  })

  it('round-trip con colombiaLocalToISO conserva la hora ingresada', () => {
    const iso = colombiaLocalToISO('2026-03-10T07:30')
    expect(formatSessionTime(iso).replace(/\s+/g, ' ')).toContain('07:30')
  })
})

describe('formatSessionDate', () => {
  it('mantiene el día Colombia aunque en UTC ya sea el día siguiente', () => {
    // 02:00Z del 25 = 21:00 del 24 en Colombia → debe decir 24, no 25
    const out = formatSessionDate('2026-06-25T02:00:00.000Z')
    expect(out).toContain('24')
    expect(out).not.toContain('25')
  })

  it('formato largo con año', () => {
    const out = formatSessionDate('2026-06-24T23:00:00.000Z', { long: true, year: true })
    expect(out).toContain('2026')
    expect(out.toLowerCase()).toContain('miércoles')
  })
})

describe('formatBookingDateTime', () => {
  it('muestra fecha y hora de la reserva en Colombia, no en UTC', () => {
    // Reserva 20:00–21:00 del 24 jun en Colombia = 01:00–02:00Z del 25 jun
    const out = formatBookingDateTime('2026-06-25T01:00:00.000Z', '2026-06-25T02:00:00.000Z')
    expect(out).toContain('24')      // día Colombia, no el 25 de UTC
    expect(out).not.toContain('25')
    expect(out).toContain('20:00')   // hora Colombia, no 01:00 de UTC
    expect(out).toContain('21:00')
  })
})
