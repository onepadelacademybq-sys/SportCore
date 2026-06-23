import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { calcBilling, nextClassDate, addOneMonth } from '@/lib/groups/billing'

// ──────────────────────────────────────────
// calcBilling
// ──────────────────────────────────────────

describe('calcBilling — datos faltantes', () => {
  it('devuelve null si monthly_fee es null', () => {
    expect(calcBilling({ monthly_fee: null, next_payment_due: '2026-07-01' })).toBeNull()
  })

  it('devuelve null si next_payment_due es null', () => {
    expect(calcBilling({ monthly_fee: 100_000, next_payment_due: null })).toBeNull()
  })
})

describe('calcBilling — pago al día', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('no está vencido cuando hoy es antes del vencimiento', () => {
    // Vence el 2026-07-10, hoy es 2026-07-05
    vi.setSystemTime(new Date('2026-07-05T12:00:00Z'))
    const result = calcBilling({ monthly_fee: 100_000, next_payment_due: '2026-07-10' })!
    expect(result.isOverdue).toBe(false)
    expect(result.moraPct).toBe(0)
    expect(result.amount).toBe(100_000)
    expect(result.daysLate).toBe(0)
  })

  it('showWarning es true cuando faltan ≤ 2 días', () => {
    vi.setSystemTime(new Date('2026-07-09T12:00:00Z')) // faltan 1 día
    const result = calcBilling({ monthly_fee: 100_000, next_payment_due: '2026-07-10' })!
    expect(result.showWarning).toBe(true)
    expect(result.daysUntilDue).toBe(1)
  })

  it('showWarning es false cuando faltan > 2 días', () => {
    vi.setSystemTime(new Date('2026-07-07T12:00:00Z')) // faltan 3 días
    const result = calcBilling({ monthly_fee: 100_000, next_payment_due: '2026-07-10' })!
    expect(result.showWarning).toBe(false)
  })
})

describe('calcBilling — período de gracia (1–4 días tarde)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('no aplica mora en los primeros 4 días de retraso', () => {
    // Venció el 2026-07-01, hoy es 2026-07-04 → 3 días tarde (dentro de gracia)
    vi.setSystemTime(new Date('2026-07-04T23:59:59Z'))
    const result = calcBilling({ monthly_fee: 100_000, next_payment_due: '2026-07-01' })!
    expect(result.isOverdue).toBe(false)
    expect(result.amount).toBe(100_000)
  })
})

describe('calcBilling — mora aplicada (> 4 días tarde)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('aplica mora del 10% después de 5 días de retraso', () => {
    // Venció el 2026-07-01, hoy es 2026-07-08 → 7 días tarde
    vi.setSystemTime(new Date('2026-07-08T12:00:00Z'))
    const result = calcBilling({ monthly_fee: 100_000, next_payment_due: '2026-07-01' })!
    expect(result.isOverdue).toBe(true)
    expect(result.moraPct).toBe(10)
    expect(result.amount).toBe(110_000)
  })

  it('acepta monthly_fee como string (viene de Prisma DECIMAL)', () => {
    vi.setSystemTime(new Date('2026-07-08T12:00:00Z'))
    const result = calcBilling({ monthly_fee: '200000', next_payment_due: '2026-07-01' })!
    expect(result.fee).toBe(200_000)
    expect(result.amount).toBe(220_000)
  })
})

// ──────────────────────────────────────────
// nextClassDate
// ──────────────────────────────────────────

describe('nextClassDate', () => {
  it('devuelve `from` si no hay horarios', () => {
    const from = new Date('2026-07-07T10:00:00Z') // lunes
    const result = nextClassDate([], from)
    expect(result.getTime()).toBe(from.getTime())
  })

  it('devuelve el próximo día que coincide con el horario', () => {
    // from = lunes 7 julio; horario = miércoles (day_of_week=3)
    const from = new Date('2026-07-07T10:00:00Z')
    const result = nextClassDate([{ day_of_week: 3 }], from)
    expect(result.getDay()).toBe(3) // miércoles
    expect(result.getDate()).toBe(8) // 8 de julio
  })

  it('funciona cuando el próximo día es el día siguiente (martes → martes+7)', () => {
    // from = martes 8 julio; próxima clase también es martes → siguiente semana
    const from = new Date('2026-07-08T10:00:00Z') // martes
    const result = nextClassDate([{ day_of_week: 2 }], from) // martes
    expect(result.getDay()).toBe(2)
    // Debe ser el próximo martes, no el mismo día
    expect(result.getDate()).toBeGreaterThan(from.getDate())
  })

  it('maneja múltiples horarios y toma el más cercano', () => {
    // from = lunes; horarios lunes y miércoles → próxima es martes...
    // pero si los horarios son [3 (mié), 5 (vie)] desde lunes, el más cercano es mié
    const from = new Date('2026-07-07T10:00:00Z') // lunes
    const result = nextClassDate([{ day_of_week: 5 }, { day_of_week: 3 }], from)
    expect(result.getDay()).toBe(3) // miércoles es antes que viernes
  })
})

// ──────────────────────────────────────────
// addOneMonth
// ──────────────────────────────────────────

// addOneMonth usa getDate/setMonth (hora local) → construir fechas con new Date(y, m, d)
// para evitar que la ISO string se interprete en UTC y el getDate() devuelva el día anterior.
describe('addOneMonth', () => {
  it('suma 1 mes en caso normal', () => {
    const result = addOneMonth(new Date(2026, 2, 15)) // 15 mar (local)
    expect(result.getMonth()).toBe(3)  // abril
    expect(result.getDate()).toBe(15)
  })

  it('31 enero → 28 febrero (febrero no tiene 31 días)', () => {
    const result = addOneMonth(new Date(2026, 0, 31)) // 31 ene
    expect(result.getMonth()).toBe(1)  // febrero
    expect(result.getDate()).toBe(28)
  })

  it('31 marzo → 30 abril', () => {
    const result = addOneMonth(new Date(2026, 2, 31)) // 31 mar
    expect(result.getMonth()).toBe(3)  // abril
    expect(result.getDate()).toBe(30)
  })

  it('30 noviembre → 30 diciembre', () => {
    const result = addOneMonth(new Date(2026, 10, 30)) // 30 nov
    expect(result.getMonth()).toBe(11) // diciembre
    expect(result.getDate()).toBe(30)
  })

  it('28 febrero → 28 marzo', () => {
    const result = addOneMonth(new Date(2026, 1, 28)) // 28 feb
    expect(result.getMonth()).toBe(2)  // marzo
    expect(result.getDate()).toBe(28)
  })
})
