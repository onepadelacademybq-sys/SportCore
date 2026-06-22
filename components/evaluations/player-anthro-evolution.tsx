'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SvgLineChart } from './svg-line-chart'
import type { AnthroPoint } from '@/actions/evaluations'

interface Props {
  points: AnthroPoint[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

function fmtNum(n: number | null, dec = 1) {
  return n !== null ? n.toFixed(dec) : '—'
}

function DeltaBadge({
  first, last, unit, lowerIsBetter = false,
}: {
  first: number | null; last: number | null; unit: string; lowerIsBetter?: boolean
}) {
  if (first === null || last === null) return <span className="text-muted-foreground text-xs">sin datos</span>

  const diff = Math.round((last - first) * 100) / 100
  const improved = lowerIsBetter ? diff < 0 : diff > 0

  const sign   = diff > 0 ? '+' : ''
  const arrow  = diff === 0 ? '→' : improved ? '↑' : '↓'
  const cls    = diff === 0 ? 'text-muted-foreground' : improved ? 'text-emerald-500' : 'text-red-400'

  return (
    <span className={`text-xs font-semibold tabular-nums ${cls}`}>
      {arrow} {sign}{diff.toFixed(1)} {unit}
    </span>
  )
}

function domainFor(points: AnthroPoint[], key: keyof AnthroPoint, pad = 0.12): [number, number] {
  const vals = points.map(p => p[key] as number | null).filter((v): v is number => v !== null)
  if (!vals.length) return [0, 100]
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)
  const span = hi - lo || Math.max(hi * 0.5, 1)
  return [
    Math.max(0, Math.floor((lo - span * pad) * 10) / 10),
    Math.ceil((hi + span * pad) * 10) / 10,
  ]
}

export function PlayerAnthroEvolution({ points }: Props) {
  if (points.length === 0) return null

  const hasPeso      = points.some(p => p.peso      !== null)
  const hasPctAdip   = points.some(p => p.pctAdiposo !== null)
  const hasPctMusc   = points.some(p => p.pctMusculo !== null)

  const first = points[0]
  const last  = points[points.length - 1]

  const chartData = points.map(p => ({
    label:      shortDate(p.date),
    peso:       p.peso,
    pctAdiposo: p.pctAdiposo,
    pctMusculo: p.pctMusculo,
  }))

  const [pesoMin, pesoMax] = domainFor(points, 'peso')

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Evolución Antropométrica</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* ── Variation summary ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {hasPeso && (
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Peso</p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {fmtNum(last.peso)} <span className="text-xs font-normal text-muted-foreground">kg</span>
              </p>
              <DeltaBadge first={first.peso} last={last.peso} unit="kg" />
            </div>
          )}
          {hasPctAdip && (
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">% Adiposo</p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {fmtNum(last.pctAdiposo)} <span className="text-xs font-normal text-muted-foreground">%</span>
              </p>
              <DeltaBadge first={first.pctAdiposo} last={last.pctAdiposo} unit="%" lowerIsBetter />
            </div>
          )}
          {hasPctMusc && (
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">% Músculo</p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {fmtNum(last.pctMusculo)} <span className="text-xs font-normal text-muted-foreground">%</span>
              </p>
              <DeltaBadge first={first.pctMusculo} last={last.pctMusculo} unit="%" />
            </div>
          )}
        </div>

        {/* ── Weight chart (only if ≥ 2 points with peso) ── */}
        {hasPeso && points.filter(p => p.peso !== null).length >= 2 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Peso (kg)</p>
            <SvgLineChart
              data={chartData}
              series={[{ key: 'peso', name: 'Peso', color: 'var(--brand)', strokeWidth: 2 }]}
              yMin={pesoMin}
              yMax={pesoMax}
              yUnit=" kg"
              height={180}
            />
          </div>
        )}

        {/* ── Data table ── */}
        <div className="rounded-lg border border-border overflow-x-auto">
          {/* Header */}
          <div
            className="grid text-[9px] font-semibold text-muted-foreground uppercase tracking-wide bg-muted/20 px-3 py-2 min-w-[320px]"
            style={{ gridTemplateColumns: `140px${hasPeso ? ' 80px' : ''}${hasPctAdip ? ' 80px' : ''}${hasPctMusc ? ' 80px' : ''}` }}
          >
            <span>Evaluación</span>
            {hasPeso    && <span className="text-center">Peso (kg)</span>}
            {hasPctAdip && <span className="text-center">% Adiposo</span>}
            {hasPctMusc && <span className="text-center">% Músculo</span>}
          </div>

          {/* Rows — chronological */}
          {points.map(p => (
            <div
              key={p.evaluationId}
              className="grid border-t border-border px-3 py-2 items-center min-w-[320px]"
              style={{ gridTemplateColumns: `140px${hasPeso ? ' 80px' : ''}${hasPctAdip ? ' 80px' : ''}${hasPctMusc ? ' 80px' : ''}` }}
            >
              <span className="text-xs text-muted-foreground">{formatDate(p.date)}</span>
              {hasPeso    && (
                <span className="text-center text-sm font-semibold tabular-nums">
                  {p.peso !== null ? p.peso.toFixed(1) : '—'}
                </span>
              )}
              {hasPctAdip && (
                <span className="text-center text-sm font-semibold tabular-nums">
                  {p.pctAdiposo !== null ? `${p.pctAdiposo.toFixed(1)}%` : '—'}
                </span>
              )}
              {hasPctMusc && (
                <span className="text-center text-sm font-semibold tabular-nums">
                  {p.pctMusculo !== null ? `${p.pctMusculo.toFixed(1)}%` : '—'}
                </span>
              )}
            </div>
          ))}
        </div>

      </CardContent>
    </Card>
  )
}
