'use client'

import type { GroupKPI, ShotKPI } from '@/actions/evaluations'

interface Props {
  groupKPIs: GroupKPI[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pctColor(pct: number | null) {
  if (pct === null) return 'text-muted-foreground'
  if (pct >= 70)    return 'text-emerald-500'
  if (pct >= 40)    return 'text-amber-500'
  return 'text-red-400'
}

function PriorityDot({ priority }: { priority: ShotKPI['priority'] }) {
  const cls =
    priority === 'buena' ? 'bg-emerald-500' :
    priority === 'media' ? 'bg-amber-500'   :
    priority === 'alta'  ? 'bg-red-400'     :
                           'bg-muted-foreground'
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${cls}`} />
}

function PriorityBadge({ priority }: { priority: GroupKPI['priority'] }) {
  if (!priority) return null
  const map = {
    alta:  'bg-red-500/10 text-red-400 border-red-400/20',
    media: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    buena: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  } as const
  const label = { alta: 'ALTA', media: 'MEDIA', buena: 'BUENA' } as const
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${map[priority]}`}>
      {label[priority]}
    </span>
  )
}

function DeltaCell({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-muted-foreground text-[11px]">—</span>
  if (delta > 0) return (
    <span className="text-emerald-500 text-[11px] font-semibold tabular-nums">↑ +{delta}%</span>
  )
  if (delta < 0) return (
    <span className="text-red-400 text-[11px] font-semibold tabular-nums">↓ {delta}%</span>
  )
  return <span className="text-muted-foreground text-[11px]">→ 0%</span>
}

// ─── Group card ───────────────────────────────────────────────────────────────

function GroupCard({ kpi }: { kpi: GroupKPI }) {
  const hasFirst  = kpi.allShots.some(s => s.firstPct !== null)
  const hasLast   = kpi.allShots.some(s => s.lastPct  !== null)
  const hasDelta  = kpi.allShots.some(s => s.delta    !== null)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* ── Group header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{kpi.label}</h3>
          <PriorityBadge priority={kpi.priority} />
        </div>
        {kpi.lastAvg !== null && (
          <span className={`text-sm font-bold tabular-nums ${pctColor(kpi.lastAvg)}`}>
            {kpi.lastAvg}%
          </span>
        )}
      </div>

      {/* ── Shots table ── */}
      <div className="overflow-x-auto">
        {/* Header */}
        <div
          className="grid text-[9px] font-semibold text-muted-foreground uppercase tracking-wide bg-muted/10 px-3 py-1.5 min-w-[420px]"
          style={{ gridTemplateColumns: hasDelta ? '1fr 56px 56px 56px 72px' : '1fr 64px 64px 64px' }}
        >
          <span>Golpe</span>
          <span className="text-center">Prom.</span>
          {hasFirst && <span className="text-center">1ª eval</span>}
          {hasLast  && <span className="text-center">Última</span>}
          {hasDelta && <span className="text-center">Δ mejora</span>}
        </div>

        {kpi.allShots.map(shot => {
          const isWeakest   = shot.strokeName === kpi.weakest?.strokeName
          const isStrongest = shot.strokeName === kpi.strongest?.strokeName && !isWeakest

          return (
            <div
              key={shot.strokeName}
              className={`grid border-t border-border px-3 py-2 items-center min-w-[420px] ${
                isWeakest   ? 'bg-red-500/5'     :
                isStrongest ? 'bg-emerald-500/5' : ''
              }`}
              style={{ gridTemplateColumns: hasDelta ? '1fr 56px 56px 56px 72px' : '1fr 64px 64px 64px' }}
            >
              {/* Name + badges */}
              <div className="flex items-center gap-1.5 pr-2 min-w-0">
                <PriorityDot priority={shot.priority} />
                <span className="text-xs truncate">{shot.strokeName}</span>
                {isWeakest && (
                  <span className="text-[9px] font-semibold text-red-400 bg-red-500/10 px-1 py-0.5 rounded shrink-0">
                    débil
                  </span>
                )}
                {isStrongest && (
                  <span className="text-[9px] font-semibold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded shrink-0">
                    fuerte
                  </span>
                )}
              </div>

              {/* Avg */}
              <span className={`text-center text-xs font-semibold tabular-nums ${pctColor(shot.overallAvg)}`}>
                {shot.overallAvg !== null ? `${shot.overallAvg}%` : '—'}
              </span>

              {/* First */}
              {hasFirst && (
                <span className="text-center text-[11px] text-muted-foreground tabular-nums">
                  {shot.firstPct !== null ? `${shot.firstPct}%` : '—'}
                </span>
              )}

              {/* Last */}
              {hasLast && (
                <span className={`text-center text-[11px] font-medium tabular-nums ${pctColor(shot.lastPct)}`}>
                  {shot.lastPct !== null ? `${shot.lastPct}%` : '—'}
                </span>
              )}

              {/* Delta */}
              {hasDelta && (
                <div className="flex justify-center">
                  <DeltaCell delta={shot.delta} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Footer summary ── */}
      {(kpi.weakest || kpi.strongest) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 px-4 py-2 border-t border-border bg-muted/5 text-xs text-muted-foreground">
          {kpi.weakest && (
            <span>
              🔴 Débil:{' '}
              <span className="font-medium text-foreground">{kpi.weakest.strokeName}</span>
              {' '}({kpi.weakest.overallAvg}%)
            </span>
          )}
          {kpi.strongest && kpi.strongest.strokeName !== kpi.weakest?.strokeName && (
            <span>
              🟢 Fuerte:{' '}
              <span className="font-medium text-foreground">{kpi.strongest.strokeName}</span>
              {' '}({kpi.strongest.overallAvg}%)
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function PlayerKPIs({ groupKPIs }: Props) {
  if (groupKPIs.length === 0) return null

  return (
    <div className="space-y-4">
      {groupKPIs.map(kpi => (
        <GroupCard key={kpi.group} kpi={kpi} />
      ))}
    </div>
  )
}
