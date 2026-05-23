'use server'

import { createClient } from '@/lib/supabase/server'
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
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getPlayerWallet(playerId?: string): Promise<WalletData | null> {
  const supabase = await createClient()

  const targetId = playerId ?? (await (async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    return user.id
  })())

  const { data } = await supabase
    .from('class_wallet')
    .select('id, total_classes, used_classes, available_classes, updated_at')
    .eq('player_id', targetId)
    .single()

  return data as WalletData | null
}

export async function getWalletTransactions(limit = 10): Promise<WalletTransaction[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('wallet_transactions')
    .select('id, type, classes, description, created_at, booking_id')
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
): Promise<void> {
  // Upsert wallet — create if player has none yet
  const { data: existing } = await supabase
    .from('class_wallet')
    .select('id, total_classes')
    .eq('player_id', playerId)
    .single()

  const ex = existing as { id: string; total_classes: number } | null

  if (ex) {
    await supabase
      .from('class_wallet')
      .update({ total_classes: ex.total_classes + classes })
      .eq('player_id', playerId)
  } else {
    await supabase
      .from('class_wallet')
      .insert({ player_id: playerId, total_classes: classes, used_classes: 0 })
  }

  await supabase.from('wallet_transactions').insert({
    player_id:   playerId,
    booking_id:  bookingId,
    type:        'credit',
    classes,
    description,
  })
}

export async function debitClass(
  supabase: Awaited<ReturnType<typeof createClient>>,
  playerId: string,
  bookingId: string,
  description: string,
): Promise<{ error: string } | null> {
  const { data: wallet } = await supabase
    .from('class_wallet')
    .select('id, used_classes, available_classes')
    .eq('player_id', playerId)
    .single()

  const w = wallet as { id: string; used_classes: number; available_classes: number } | null

  if (!w || w.available_classes < 1) {
    return { error: 'No tenés clases disponibles en tu billetera' }
  }

  await supabase
    .from('class_wallet')
    .update({ used_classes: w.used_classes + 1 })
    .eq('player_id', playerId)

  await supabase.from('wallet_transactions').insert({
    player_id:   playerId,
    booking_id:  bookingId,
    type:        'debit',
    classes:     1,
    description,
  })

  return null
}
