'use client'

import { useState } from 'react'
import { demoLoginAction } from '@/actions/demo'
import type { Metadata } from 'next'

// metadata can't be exported from a 'use client' file — set it in a wrapper if needed
// export const metadata: Metadata = { title: 'Demo — SportCore' }

const ROLES = [
  {
    key:         'admin' as const,
    icon:        '👤',
    label:       'Administrador',
    color:       'border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10',
    activeColor: 'border-primary bg-primary/15',
    description: 'Visión completa del negocio',
    features: [
      'Dashboard con KPIs en tiempo real',
      'Gestión de reservas y confirmaciones',
      'Finanzas: ingresos, egresos, flujo de caja',
      'CRM de clientes y historial',
      'Gestión de grupos y facturación mensual',
      'Torneos y brackets automáticos',
    ],
  },
  {
    key:         'coach' as const,
    icon:        '🎾',
    label:       'Entrenador',
    color:       'border-accent/40 hover:border-accent bg-accent/5 hover:bg-accent/10',
    activeColor: 'border-accent bg-accent/15',
    description: 'Herramientas pedagógicas',
    features: [
      'Agenda de clases y grupos asignados',
      'Planificación: mesociclos y sesiones',
      'Evaluaciones técnicas V3 con semáforo',
      'Seguimiento de progreso por jugador',
      'Biblioteca de ejercicios personalizada',
      'Perfil profesional con disponibilidad',
    ],
  },
  {
    key:         'player' as const,
    icon:        '🏃',
    label:       'Jugador',
    color:       'border-emerald-500/40 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10',
    activeColor: 'border-emerald-500 bg-emerald-500/15',
    description: 'Experiencia del alumno',
    features: [
      'Reserva de clases con calendario',
      'E-wallet de clases y módulos',
      'Mis evaluaciones y progreso técnico',
      'Inscripción en grupos y torneos',
      'Historial de sesiones',
      'Pago con tarjeta o transferencia',
    ],
  },
]

export default function DemoPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  async function handleLogin(role: 'admin' | 'coach' | 'player') {
    setLoading(role)
    setError(null)
    const result = await demoLoginAction(role)
    if (result?.error) {
      setError(result.error)
      setLoading(null)
    }
    // On success, demoLoginAction redirects — nothing more to do
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-10 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wider mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ENTORNO DE DEMOSTRACIÓN
        </div>
        <h1 className="text-3xl font-bold tracking-tight">SportCore</h1>
        <p className="text-muted-foreground text-sm max-w-md">
          Plataforma de gestión para academias deportivas.
          Selecciona un perfil y explora la plataforma en segundos.
        </p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
        {ROLES.map((r) => (
          <button
            key={r.key}
            disabled={loading !== null}
            onClick={() => handleLogin(r.key)}
            className={`group relative text-left rounded-xl border-2 p-5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
              loading === r.key ? r.activeColor : r.color
            }`}
          >
            {loading === r.key && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
                <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{r.icon}</span>
                <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                  Un clic →
                </span>
              </div>
              <div>
                <p className="font-semibold text-base">{r.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
              </div>
              <ul className="space-y-1 pt-1 border-t border-border/50">
                {r.features.map((f) => (
                  <li key={f} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">·</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-6 max-w-sm w-full rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      <p className="mt-8 text-[11px] text-muted-foreground text-center max-w-xs">
        Datos de ejemplo — ninguna acción en este entorno tiene efectos reales.
        <br />
        <a href="/login" className="underline hover:text-foreground transition-colors mt-1 inline-block">
          Ir al login real →
        </a>
      </p>
    </div>
  )
}
