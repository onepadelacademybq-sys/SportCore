'use client'

import { useEffect, useState } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

interface Props {
  expiresAt: string
}

function getRemainingSeconds(expiresAt: string): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
}

function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function BookingCountdown({ expiresAt }: Props) {
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(expiresAt))

  useEffect(() => {
    if (remaining === 0) return
    const id = setInterval(() => {
      const secs = getRemainingSeconds(expiresAt)
      setRemaining(secs)
      if (secs === 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [expiresAt, remaining])

  if (remaining === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        Reserva expirada — recarga la página
      </div>
    )
  }

  const isUrgent = remaining <= 5 * 60 // últimos 5 minutos

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${isUrgent ? 'text-red-500' : 'text-amber-500'}`}>
      <Clock className="h-3.5 w-3.5 shrink-0" />
      Tiempo para pagar: <span className="font-mono tabular-nums">{formatRemaining(remaining)}</span>
    </div>
  )
}
