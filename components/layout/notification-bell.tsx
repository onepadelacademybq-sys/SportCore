'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, CheckCircle, XCircle, CreditCard, AlertCircle,
  LayoutList, Megaphone, ClipboardList, Trophy, UsersRound,
} from 'lucide-react'
import { getMyNotifications, markAsRead, markAllAsRead } from '@/actions/notifications'
import type { AppNotification, NotificationType } from '@/actions/notifications'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)   return 'ahora'
  if (mins < 60)  return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7)   return `hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  booking_confirmed: { icon: CheckCircle,   color: 'text-emerald-400' },
  booking_cancelled: { icon: XCircle,       color: 'text-red-400' },
  booking_reminder:  { icon: Bell,          color: 'text-amber-400' },
  payment_processed: { icon: CreditCard,    color: 'text-blue-400' },
  payment_overdue:   { icon: AlertCircle,   color: 'text-amber-400' },
  payment_failed:    { icon: AlertCircle,   color: 'text-red-400' },
  session_assigned:  { icon: LayoutList,    color: 'text-brand' },
  session_cancelled: { icon: XCircle,       color: 'text-orange-400' },
  session_reminder:  { icon: Bell,          color: 'text-amber-400' },
  evaluation_ready:  { icon: ClipboardList, color: 'text-purple-400' },
  tournament_update: { icon: Trophy,        color: 'text-orange-400' },
  group_change:      { icon: UsersRound,    color: 'text-blue-400' },
  announcement:      { icon: Megaphone,     color: 'text-muted-foreground' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isOpen, setIsOpen]               = useState(false)
  const [isPending, startTransition]      = useTransition()
  const wrapperRef                        = useRef<HTMLDivElement>(null)
  const router                            = useRouter()

  const unreadCount = notifications.filter((n) => !n.is_read).length

  async function load() {
    try {
      const data = await getMyNotifications()
      setNotifications(data)
    } catch {
      // silently ignore — network errors shouldn't break the sidebar
    }
  }

  // Initial load + poll every 30 s
  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function handleMarkAll() {
    startTransition(async () => {
      try {
        await markAllAsRead()
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      } catch {
        // silently ignore — mutation errors shouldn't break the sidebar
      }
    })
  }

  function handleClickNotification(n: AppNotification) {
    if (!n.is_read) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
      )
      markAsRead(n.id) // fire-and-forget
    }
    if (n.action_url) {
      setIsOpen(false)
      router.push(n.action_url)
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-0 left-full ml-2 w-80 rounded-lg border border-border bg-card shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <h3 className="text-sm font-semibold">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={isPending}
                className="text-xs text-brand hover:underline disabled:opacity-50 transition-opacity"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg  = TYPE_CONFIG[n.type] ?? { icon: Bell, color: 'text-muted-foreground' }
                const Icon = cfg.icon
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClickNotification(n)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${
                      !n.is_read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5 whitespace-nowrap">
                      {relativeTime(n.created_at)}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
