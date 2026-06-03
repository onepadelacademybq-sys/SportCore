'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'booking_cancelled'
  | 'session_assigned'
  | 'session_reminder'
  | 'session_cancelled'
  | 'evaluation_ready'
  | 'payment_processed'
  | 'payment_failed'
  | 'payment_overdue'
  | 'tournament_update'
  | 'group_change'
  | 'announcement'

export type AppNotification = {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  is_read: boolean
  action_url: string | null
  created_at: string
}

// ─── Internal helpers — llamados desde otros server actions ──────────────────

/** Crea una notificación para un usuario específico. */
export async function createNotification(
  userId: string,
  title: string,
  body: string,
  type: NotificationType,
  actionUrl?: string,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('notifications').insert({
    user_id:    userId,
    type,
    title,
    body,
    action_url: actionUrl ?? null,
  })
  if (error) console.error('[createNotification]', error)
}

/** Notifica a todos los admins activos a la vez. */
export async function notifyAdmins(
  title: string,
  body: string,
  type: NotificationType,
  actionUrl?: string,
): Promise<void> {
  const admin = createAdminClient()
  const { data: admins } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .eq('is_active', true)

  if (!admins || admins.length === 0) return

  const rows = (admins as { id: string }[]).map((a) => ({
    user_id:    a.id,
    type,
    title,
    body,
    action_url: actionUrl ?? null,
  }))
  const { error } = await admin.from('notifications').insert(rows)
  if (error) console.error('[notifyAdmins]', error)
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getMyNotifications(): Promise<AppNotification[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, type, title, body, is_read, action_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) console.error('[getMyNotifications]', error)
  return (data ?? []) as AppNotification[]
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) console.error('[getUnreadCount]', error)
  return count ?? 0
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function markAsRead(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user.id)
}

export async function markAllAsRead(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) console.error('[markAllAsRead]', error)
  revalidatePath('/', 'layout')
}
