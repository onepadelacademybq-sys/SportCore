import { describe, it, expect, vi, beforeEach } from 'vitest'

// El débito/crédito ahora son atómicos vía Prisma ($executeRaw): un único
// UPDATE/UPSERT con guarda, sin read-modify-write en JS. Mockeamos getPrisma
// para controlar las filas afectadas (saldo suficiente o no).

const executeRawMock = vi.fn<(...args: any[]) => Promise<number>>()

vi.mock('@/lib/prisma', () => ({
  getPrisma: () => ({ $executeRaw: executeRawMock }),
}))

import { debitClass, creditClasses } from '@/actions/wallet'

function makeMockSupabase() {
  const insertSpy = vi.fn()
  return {
    _insertSpy: insertSpy,
    from: (table: string) => ({
      insert: (payload: any) => {
        insertSpy(table, payload)
        return Promise.resolve({ error: null })
      },
    }),
  }
}

beforeEach(() => {
  executeRawMock.mockReset().mockResolvedValue(1)
})

// ──────────────────────────────────────────
// debitClass
// ──────────────────────────────────────────

describe('debitClass — sin saldo', () => {
  it('retorna error y no registra transacción cuando el UPDATE no afecta filas', async () => {
    executeRawMock.mockResolvedValueOnce(0)
    const supabase = makeMockSupabase()
    const result = await debitClass(supabase as any, 'player-1', '', 'desc')
    expect(result).toEqual({ error: 'No tenés clases disponibles en tu billetera' })
    expect(supabase._insertSpy).not.toHaveBeenCalled()
  })
})

describe('debitClass — débito exitoso', () => {
  let supabase: ReturnType<typeof makeMockSupabase>

  beforeEach(() => {
    supabase = makeMockSupabase()
  })

  it('retorna null en caso de éxito', async () => {
    const result = await debitClass(supabase as any, 'player-1', 'booking-1', 'Clase reservada')
    expect(result).toBeNull()
  })

  it('ejecuta el UPDATE atómico con guarda (afecta 1 fila)', async () => {
    await debitClass(supabase as any, 'player-1', 'booking-1', 'Clase reservada')
    expect(executeRawMock).toHaveBeenCalledTimes(1)
    // los valores interpolados incluyen el playerId
    expect(executeRawMock.mock.calls[0]).toContain('player-1')
  })

  it('inserta una transacción de tipo debit', async () => {
    await debitClass(supabase as any, 'player-1', 'booking-1', 'Clase reservada')
    expect(supabase._insertSpy).toHaveBeenCalledWith(
      'wallet_transactions',
      expect.objectContaining({ type: 'debit', classes: 1, player_id: 'player-1' }),
    )
  })
})

// ──────────────────────────────────────────
// creditClasses
// ──────────────────────────────────────────

describe('creditClasses', () => {
  let supabase: ReturnType<typeof makeMockSupabase>

  beforeEach(() => {
    supabase = makeMockSupabase()
  })

  it('ejecuta el upsert atómico de incremento', async () => {
    await creditClasses(supabase as any, 'player-1', 'booking-1', 8, 'Módulo de 8 clases')
    expect(executeRawMock).toHaveBeenCalledTimes(1)
    expect(executeRawMock.mock.calls[0]).toContain('player-1')
    expect(executeRawMock.mock.calls[0]).toContain(8)
  })

  it('inserta una transacción de tipo credit', async () => {
    await creditClasses(supabase as any, 'player-1', 'booking-1', 8, 'Módulo de 8 clases')
    expect(supabase._insertSpy).toHaveBeenCalledWith(
      'wallet_transactions',
      expect.objectContaining({ type: 'credit', classes: 8, player_id: 'player-1' }),
    )
  })

  it('usa slotType "any" por defecto', async () => {
    await creditClasses(supabase as any, 'player-1', 'booking-1', 1, 'desc')
    expect(supabase._insertSpy).toHaveBeenCalledWith(
      'wallet_transactions',
      expect.objectContaining({ slot_type: 'any' }),
    )
  })

  it('respeta el slotType dado', async () => {
    await creditClasses(supabase as any, 'player-1', 'booking-1', 1, 'desc', 'am')
    expect(supabase._insertSpy).toHaveBeenCalledWith(
      'wallet_transactions',
      expect.objectContaining({ slot_type: 'am' }),
    )
  })
})

// ──────────────────────────────────────────
// Rollback: debit → INSERT de booking falla → credit revierte.
// El invariante "available queda igual" ahora lo garantiza el SQL
// (used += 1, luego total += 1). El test verifica que la compensación
// dispara su upsert atómico.
// ──────────────────────────────────────────

describe('Rollback de wallet al fallar el INSERT de booking', () => {
  it('debit y credit de reversión ejecutan su sentencia atómica', async () => {
    const supabase = makeMockSupabase()

    const debitErr = await debitClass(supabase as any, 'player-1', '', 'Clase reservada')
    expect(debitErr).toBeNull()

    await creditClasses(supabase as any, 'player-1', '', 1, 'Reversión — reserva fallida')

    // un executeRaw por el débito + uno por la reversión
    expect(executeRawMock).toHaveBeenCalledTimes(2)
  })
})
