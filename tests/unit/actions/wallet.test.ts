import { describe, it, expect, vi, beforeEach } from 'vitest'
import { debitClass, creditClasses } from '@/actions/wallet'

// ──────────────────────────────────────────
// Mock factory para el cliente Supabase.
// Cada llamada a `from(table)` devuelve stubs
// configurados por tabla.
// ──────────────────────────────────────────

type TableMock = {
  selectData?: Record<string, any> | null
  insertError?: { message: string } | null
  updateError?: { message: string } | null
}

function makeMockSupabase(tables: Record<string, TableMock> = {}) {
  const insertSpy = vi.fn()
  const updateSpy = vi.fn()

  const client = {
    _insertSpy: insertSpy,
    _updateSpy: updateSpy,
    from: (table: string) => {
      const t = tables[table] ?? {}
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: t.selectData ?? null }),
          }),
        }),
        insert: (payload: any) => {
          insertSpy(table, payload)
          return Promise.resolve({ error: t.insertError ?? null })
        },
        update: (payload: any) => ({
          eq: (_col: string, _val: string) => {
            updateSpy(table, payload)
            return Promise.resolve({ error: t.updateError ?? null })
          },
        }),
      }
    },
  }

  return client
}

// ──────────────────────────────────────────
// debitClass
// ──────────────────────────────────────────

describe('debitClass — sin saldo', () => {
  it('retorna error si el jugador no tiene wallet', async () => {
    const supabase = makeMockSupabase({ class_wallet: { selectData: null } })
    const result = await debitClass(supabase as any, 'player-1', '', 'desc')
    expect(result).toEqual({ error: 'No tenés clases disponibles en tu billetera' })
    expect(supabase._updateSpy).not.toHaveBeenCalled()
    expect(supabase._insertSpy).not.toHaveBeenCalled()
  })

  it('retorna error si available_classes es 0', async () => {
    const supabase = makeMockSupabase({
      class_wallet: { selectData: { id: 'w1', used_classes: 5, available_classes: 0 } },
    })
    const result = await debitClass(supabase as any, 'player-1', '', 'desc')
    expect(result).toEqual({ error: 'No tenés clases disponibles en tu billetera' })
    expect(supabase._updateSpy).not.toHaveBeenCalled()
  })
})

describe('debitClass — débito exitoso', () => {
  let supabase: ReturnType<typeof makeMockSupabase>

  beforeEach(() => {
    supabase = makeMockSupabase({
      class_wallet: { selectData: { id: 'w1', used_classes: 3, available_classes: 2 } },
    })
  })

  it('retorna null en caso de éxito', async () => {
    const result = await debitClass(supabase as any, 'player-1', 'booking-1', 'Clase reservada')
    expect(result).toBeNull()
  })

  it('incrementa used_classes en 1', async () => {
    await debitClass(supabase as any, 'player-1', 'booking-1', 'Clase reservada')
    expect(supabase._updateSpy).toHaveBeenCalledWith('class_wallet', { used_classes: 4 })
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

describe('creditClasses — wallet existente', () => {
  let supabase: ReturnType<typeof makeMockSupabase>

  beforeEach(() => {
    supabase = makeMockSupabase({
      class_wallet: { selectData: { id: 'w1', total_classes: 5 } },
    })
  })

  it('incrementa total_classes', async () => {
    await creditClasses(supabase as any, 'player-1', 'booking-1', 1, 'Módulo acreditado')
    expect(supabase._updateSpy).toHaveBeenCalledWith('class_wallet', { total_classes: 6 })
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

describe('creditClasses — wallet nueva (primer crédito)', () => {
  it('inserta la wallet en lugar de actualizar cuando no existe', async () => {
    const supabase = makeMockSupabase({ class_wallet: { selectData: null } })
    await creditClasses(supabase as any, 'player-1', '', 3, 'Módulo')
    expect(supabase._insertSpy).toHaveBeenCalledWith(
      'class_wallet',
      expect.objectContaining({ player_id: 'player-1', total_classes: 3, used_classes: 0 }),
    )
    expect(supabase._updateSpy).not.toHaveBeenCalledWith('class_wallet', expect.anything())
  })
})

// ──────────────────────────────────────────
// Rollback: debit → INSERT falla → credit revierte
// Documenta que el disponible queda igual que antes del débito.
// ──────────────────────────────────────────

describe('Rollback de wallet al fallar el INSERT de booking', () => {
  it('disponible queda igual tras debit + credit de reversión', async () => {
    // Estado inicial: total=5, used=3 → available=2
    const walletState = { id: 'w1', total_classes: 5, used_classes: 3, available_classes: 2 }

    let currentUsed  = walletState.used_classes
    let currentTotal = walletState.total_classes

    const supabase = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: table === 'class_wallet'
                ? { ...walletState, used_classes: currentUsed, total_classes: currentTotal,
                    available_classes: currentTotal - currentUsed }
                : null,
            }),
          }),
        }),
        update: (payload: any) => ({
          eq: () => {
            if (table === 'class_wallet') {
              if ('used_classes'  in payload) currentUsed  = payload.used_classes
              if ('total_classes' in payload) currentTotal = payload.total_classes
            }
            return Promise.resolve({ error: null })
          },
        }),
        insert: (_payload: any) => Promise.resolve({ error: null }),
      }),
    }

    // Paso 1: debitClass (debería consumir 1 clase)
    const debitErr = await debitClass(supabase as any, 'player-1', '', 'Clase reservada')
    expect(debitErr).toBeNull()
    expect(currentUsed).toBe(4) // used subió de 3 a 4

    // Paso 2: INSERT de booking "falla" — lógica de actions/bookings.ts revierte
    await creditClasses(supabase as any, 'player-1', '', 1, 'Reversión — reserva fallida')

    // Estado final: total=6, used=4 → available=2 (igual que antes del débito)
    const available = currentTotal - currentUsed
    expect(available).toBe(walletState.available_classes)
  })
})
