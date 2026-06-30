'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays, CheckCircle2, Clock, AlertCircle,
  ChevronRight, UserCheck, XCircle,
} from 'lucide-react'
import type { CoachSession } from '@/actions/training'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Bogota',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })
}

function isToday(iso: string) {
  const d = new Date(iso)
  const t = new Date()
  return d.getFullYear() === t.getFullYear() &&
         d.getMonth()    === t.getMonth()    &&
         d.getDate()     === t.getDate()
}

const STATUS_META = {
  scheduled: { label: 'Programada', icon: Clock,         color: 'text-blue-400',  bg: 'bg-blue-500/10' },
  completed: { label: 'Completada', icon: CheckCircle2,  color: 'text-green-400', bg: 'bg-green-500/10' },
  cancelled: { label: 'Cancelada',  icon: XCircle,       color: 'text-red-400',   bg: 'bg-red-500/10' },
}

// ── Session card ──────────────────────────────────────────────────────────────

function SessionCard({ s, showAttBadge }: { s: CoachSession; showAttBadge?: boolean }) {
  const meta    = STATUS_META[s.status]
  const Icon    = meta.icon
  const today   = isToday(s.scheduledAt)
  const href    = `/coach/planning/${s.mesocycleId}/session/${s.id}`

  return (
    <Link
      href={href}
      className="block rounded-xl border bg-card hover:border-primary/40 transition-colors p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          {/* Date */}
          <div className="flex items-center gap-2">
            {today && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase tracking-wide">
                Hoy
              </span>
            )}
            <p className="text-sm font-semibold">
              {formatDate(s.scheduledAt)} · {formatTime(s.scheduledAt)}
            </p>
          </div>

          {/* Mesocycle + week */}
          <p className="text-xs text-muted-foreground truncate">
            {s.mesocycleName}
            {s.weekNumber > 0 && <span className="ml-1">— Semana {s.weekNumber}</span>}
          </p>

          {/* Duration + attendance */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{s.durationMin} min</span>
            {s.status === 'completed' && (
              <span className={`flex items-center gap-0.5 ${s.attendanceCount > 0 ? 'text-green-400' : 'text-amber-400'}`}>
                <UserCheck className="h-3 w-3" />
                {s.attendanceCount > 0 ? `${s.attendanceCount} registrados` : 'Sin asistencia'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status badge */}
          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${meta.bg} ${meta.color} font-medium`}>
            <Icon className="h-3 w-3" />
            {meta.label}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'upcoming',  label: 'Próximas' },
  { id: 'attention', label: 'Pendientes' },
  { id: 'history',   label: 'Historial' },
] as const

type TabId = typeof TABS[number]['id']

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props { sessions: CoachSession[] }

export function CoachTrainingsDashboard({ sessions }: Props) {
  const [tab, setTab] = useState<TabId>('upcoming')

  const now = new Date()

  const upcoming   = sessions.filter((s) => s.status === 'scheduled').sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  const needsAtt   = sessions.filter((s) => s.status === 'completed' && s.attendanceCount === 0)
  const history    = sessions.filter((s) => s.status !== 'scheduled').sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())

  // KPIs for current month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const thisMonth  = sessions.filter((s) => new Date(s.scheduledAt).getTime() >= monthStart)
  const completedCount  = thisMonth.filter((s) => s.status === 'completed').length
  const scheduledCount  = thisMonth.filter((s) => s.status === 'scheduled').length
  const pendingAttCount = needsAtt.filter((s) => new Date(s.scheduledAt).getTime() >= monthStart).length

  const lists: Record<TabId, CoachSession[]> = {
    upcoming:  upcoming,
    attention: needsAtt,
    history:   history,
  }

  const empty: Record<TabId, string> = {
    upcoming:  'No hay sesiones programadas.',
    attention: 'Todas las sesiones completadas tienen asistencia registrada.',
    history:   'Sin sesiones en el historial.',
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Completadas este mes',  value: completedCount,  icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Programadas este mes',  value: scheduledCount,  icon: CalendarDays, color: 'text-blue-400' },
          { label: 'Pendientes asistencia', value: pendingAttCount, icon: AlertCircle,  color: 'text-amber-400' },
          { label: 'Total sesiones',        value: sessions.length, icon: CalendarDays, color: 'text-muted-foreground' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            {t.id === 'attention' && needsAtt.length > 0 && (
              <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                {needsAtt.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-3">
        {lists[tab].length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">{empty[tab]}</div>
        ) : (
          lists[tab].map((s) => <SessionCard key={s.id} s={s} />)
        )}
      </div>
    </div>
  )
}
