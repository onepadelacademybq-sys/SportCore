'use server'

import { createClient } from '@/lib/supabase/server'
import { getPrisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

export type WalletData = {
  id:                string
  total_classes:     number
  used_classes:      number
  available_classes: number
  updated_at:        string
}

export type WalletTransaction = {
  id:          string
  type:        'credit' | 'debit'
  classes:     number
  description: string
  created_at:  string
  booking_id:  string | null
  slot_type:   'am' | 'pm' | 'weekend' | 'any' | null
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const EMPTY_WALLET: WalletData = {
  id: '',
  total_classes: 0,
  used_classes: 0,
  available_classes: 0,
  updated_at: '',
}

export async function getPlayerWallet(playerId?: string): Promise<WalletData> {
  const supabase = await createClient()

  let targetId = playerId
  if (!targetId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    targetId = user.id
  }

  const { data } = await supabase
    .from('class_wallet')
    .select('id, total_classes, used_classes, available_classes, updated_at')
    .eq('player_id', targetId)
    .single()

  return data ? (data as WalletData) : EMPTY_WALLET
}

export async function getWalletTransactions(limit = 10): Promise<WalletTransaction[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('wallet_transactions')
    .select('id, type, classes, description, created_at, booking_id, slot_type')
    .eq('player_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as WalletTransaction[]
}

// ─── Internal helpers (called from bookings actions) ──────────────────────────

export async function creditClasses(
  supabase: Awaited<ReturnType<typeof createClient>>,
  playerId: string,
  bookingId: string,
  classes: number,
  description: string,
  slotType: 'am' | 'pm' | 'weekend' | 'any' = 'any',
): Promise<void> {
  // Incremento atómico (upsert): evita el read-modify-write que perdía créditos
  // bajo concurrencia. available_classes es columna generada — no se escribe.
  await getPrisma().$executeRaw`
    INSERT INTO class_wallet (player_id, total_classes, used_classes)
    VALUES (${playerId}::uuid, ${classes}, 0)
    ON CONFLICT (player_id)
    DO UPDATE SET total_classes = class_wallet.total_classes + ${classes},
                  updated_at = now()`

  await supabase.from('wallet_transactions').insert({
    player_id:   playerId,
    booking_id:  bookingId,
    type:        'credit',
    classes,
    description,
    slot_type:   slotType,
  })
}

export async function debitClass(
  supabase: Awaited<ReturnType<typeof createClient>>,
  playerId: string,
  bookingId: string,
  description: string,
): Promise<{ error: string } | null> {
  // Débito atómico con guarda: el incremento y el chequeo de disponibilidad
  // ocurren en una sola sentencia → sin race ni TOCTOU. affected=0 ⇒ sin saldo.
  const affected = await getPrisma().$executeRaw`
    UPDATE class_wallet
    SET used_classes = used_classes + 1, updated_at = now()
    WHERE player_id = ${playerId}::uuid
      AND (total_classes - used_classes) >= 1`

  if (affected === 0) {
    return { error: 'No tenés clases disponibles en tu billetera' }
  }

  await supabase.from('wallet_transactions').insert({
    player_id:   playerId,
    booking_id:  bookingId,
    type:        'debit',
    classes:     1,
    description,
  })

  return null
}
