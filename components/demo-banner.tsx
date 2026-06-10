'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { demoLoginAction } from '@/actions/demo'

export function DemoBanner() {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function switchRole(role: 'admin' | 'coach' | 'player') {
    setLoading(true)
    const result = await demoLoginAction(role)
    if (result?.error) { setLoading(false); return }
    router.refresh()
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="relative">
        {open && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex gap-2 bg-card border border-border rounded-lg shadow-xl px-3 py-2">
            {(['admin', 'coach', 'player'] as const).map((role) => (
              <button
                key={role}
                disabled={loading}
                onClick={() => switchRole(role)}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-muted hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 capitalize whitespace-nowrap"
              >
                {role === 'admin' ? '👤 Admin' : role === 'coach' ? '🎾 Entrenador' : '🏃 Jugador'}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg hover:bg-primary/90 transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          MODO DEMO
          <span className="text-primary-foreground/60 ml-0.5">{open ? '▲' : '▼'}</span>
        </button>
      </div>
    </div>
  )
}
