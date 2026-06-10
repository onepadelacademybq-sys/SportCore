'use client'

import { useState, useTransition } from 'react'
import { MessageCircle, AlertTriangle, CheckCircle, XCircle, TrendingDown, RefreshCw } from 'lucide-react'
import { WhatsAppComposer } from './whatsapp-composer'
import { recalculateRetentionScores } from '@/actions/crm'
import type { RetentionGroups, RetentionEntry } from '@/app/(dashboard)/admin/crm/page'

const GROUPS: {
  key: keyof RetentionGroups
  label: string
  icon: React.ElementType
  color: string
  text: string
  border: string
  description: string
}[] = [
  {
    key:         'active',
    label:       'Activos',
    icon:        CheckCircle,
    color:       'bg-green-500/8',
    text:        'text-green-400',
    border:      'border-green-500/20',
    description: 'Clase en los últimos 7 días',
  },
  {
    key:         'at_risk',
    label:       'En riesgo',
    icon:        AlertTriangle,
    color:       'bg-amber-500/8',
    text:        'text-amber-400',
    border:      'border-amber-500/20',
    description: 'Sin clase hace 8–14 días',
  },
  {
    key:         'losing',
    label:       'Perdiendo',
    icon:        TrendingDown,
    color:       'bg-orange-500/8',
    text:        'text-orange-400',
    border:      'border-orange-500/20',
    description: 'Sin clase hace 15–30 días',
  },
  {
    key:         'churned',
    label:       'Inactivos',
    icon:        XCircle,
    color:       'bg-red-500/8',
    text:        'text-red-400',
    border:      'border-red-500/20',
    description: 'Sin clase hace más de 30 días',
  },
]

interface Props { retention: RetentionGroups }

export function RetentionBoard({ retention }: Props) {
  const [waTarget,   setWaTarget]   = useState<{ phone: string; name: string; profileId: string } | null>(null)
  const [isPending,  startTransition] = useTransition()
  const [recalcMsg,  setRecalcMsg]  = useState<string | null>(null)

  const total = Object.values(retention).flat().length

  function handleRecalculate() {
    setRecalcMsg(null)
    startTransition(async () => {
      try {
        await recalculateRetentionScores()
        setRecalcMsg('Scores actualizados')
      } catch {
        setRecalcMsg('Error al recalcular')
      }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {total} estudiante{total !== 1 ? 's' : ''} con seguimiento activo
        </p>
        <div className="flex items-center gap-3">
          {recalcMsg && (
            <span className="text-xs text-muted-foreground">{recalcMsg}</span>
          )}
          <button
            onClick={handleRecalculate}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-input bg-background text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? 'Recalculando…' : 'Recalcular ahora'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {GROUPS.map(({ key, label, icon: Icon, color, text, border, description }) => {
          const entries = retention[key]
          return (
            <div key={key} className={`rounded-xl border ${border} ${color}`}>
              {/* Column header */}
              <div className={`flex items-center gap-2 px-4 pt-4 pb-3 border-b ${border}`}>
                <Icon className={`h-4 w-4 ${text}`} />
                <span className={`font-semibold text-sm ${text}`}>{label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{entries.length}</span>
              </div>
              <p className="text-xs text-muted-foreground px-4 py-2">{description}</p>

              {/* Student cards */}
              <div className="px-3 pb-3 space-y-2 max-h-96 overflow-y-auto">
                {entries.map((entry) => (
                  <StudentCard
                    key={entry.id}
                    entry={entry}
                    textColor={text}
                    onWhatsApp={() =>
                      setWaTarget({
                        phone:     entry.profile.whatsappPhone ?? entry.profile.phone ?? '',
                        name:      entry.profile.fullName,
                        profileId: entry.profile.id,
                      })
                    }
                  />
                ))}
                {entries.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">Sin estudiantes</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {waTarget && (
        <WhatsAppComposer
          phone={waTarget.phone}
          name={waTarget.name}
          profileId={waTarget.profileId}
          onClose={() => setWaTarget(null)}
        />
      )}
    </div>
  )
}

function StudentCard({
  entry,
  textColor,
  onWhatsApp,
}: {
  entry: RetentionEntry
  textColor: string
  onWhatsApp: () => void
}) {
  const daysAgo = entry.lastClassAt
    ? Math.floor((Date.now() - new Date(entry.lastClassAt).getTime()) / 86_400_000)
    : null

  const initials = entry.profile.fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const hasWa = !!(entry.profile.whatsappPhone ?? entry.profile.phone)

  return (
    <div className="bg-background/60 rounded-lg border border-border/50 p-3 flex items-center gap-3">
      {/* Avatar */}
      {entry.profile.avatarUrl ? (
        <img
          src={entry.profile.avatarUrl}
          alt={entry.profile.fullName}
          className="w-8 h-8 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
          {initials}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.profile.fullName}</p>
        <p className="text-xs text-muted-foreground">
          {daysAgo === null
            ? 'Sin clases registradas'
            : daysAgo === 0
            ? 'Hoy'
            : `Hace ${daysAgo} día${daysAgo !== 1 ? 's' : ''}`}
          {' · '}
          <span className={`font-medium ${textColor}`}>
            {entry.classesThisMonth} clase{entry.classesThisMonth !== 1 ? 's' : ''} este mes
          </span>
        </p>
      </div>

      {/* WhatsApp button */}
      {hasWa && (
        <button
          onClick={onWhatsApp}
          title="Enviar WhatsApp"
          className="shrink-0 p-1.5 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
