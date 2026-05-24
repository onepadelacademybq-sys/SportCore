'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SvgLineChart } from './svg-line-chart'
import type { ChartSeries, ChartPoint } from './svg-line-chart'
import type { PlayerEvolutionPoint } from '@/actions/evaluations'

interface Props {
  points: PlayerEvolutionPoint[]
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

function domainFor(data: ChartPoint[], key: string, padFraction = 0.15): [number, number] {
  const vals = data.map(d => d[key] as number | null).filter((v): v is number => v !== null)
  if (vals.length === 0) return [0, 10]
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)
  const span = hi - lo || Math.max(hi * 0.5, 1)
  return [
    Math.max(0, Math.floor((lo - span * padFraction) * 10) / 10),
    Math.ceil((hi + span * padFraction) * 10) / 10,
  ]
}

const TECH_SERIES: ChartSeries[] = [
  { key: 'techTotal',    name: 'Total General',   color: '#00C4CC', strokeWidth: 2.5 },
  { key: 'techFondo',    name: 'Golpes de Fondo', color: '#3b82f6', strokeWidth: 1.5 },
  { key: 'techVoleas',   name: 'Voleas',          color: '#8b5cf6', strokeWidth: 1.5 },
  { key: 'techBandejas', name: 'Bandejas',        color: '#f59e0b', strokeWidth: 1.5 },
  { key: 'techSmash',    name: 'Smash',           color: '#ef4444', strokeWidth: 1.5 },
]

export function PlayerEvolutionCharts({ points }: Props) {
  const chartData: ChartPoint[] = points.map(p => ({
    label:            fmtDate(p.date),
    techTotal:        p.techTotal,
    techFondo:        p.techFondo,
    techVoleas:       p.techVoleas,
    techBandejas:     p.techBandejas,
    techSmash:        p.techSmash,
    bestCMJ:          p.bestCMJ,
    bestVel10m:       p.bestVel10m,
    bestBolasLateral: p.bestBolasLateral,
  }))

  const hasTech  = points.some(p => p.techTotal !== null)
  const hasCMJ   = points.some(p => p.bestCMJ !== null)
  const hasVel   = points.some(p => p.bestVel10m !== null)
  const hasBolas = points.some(p => p.bestBolasLateral !== null)
  const hasPhys  = hasCMJ || hasVel || hasBolas

  const [cmjMin, cmjMax]     = domainFor(chartData, 'bestCMJ')
  const [velMin, velMax]     = domainFor(chartData, 'bestVel10m')
  const [bolasMin, bolasMax] = domainFor(chartData, 'bestBolasLateral')

  const physCount = [hasCMJ, hasVel, hasBolas].filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* ─── Technical evolution ─────────────────────────────────────── */}
      {hasTech && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolución Técnica</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-4">
              {TECH_SERIES.map(s => (
                <div key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="inline-block rounded-full"
                    style={{
                      width: 16,
                      height: s.key === 'techTotal' ? 3 : 1.5,
                      backgroundColor: s.color,
                    }}
                  />
                  {s.name}
                </div>
              ))}
            </div>
            <SvgLineChart
              data={chartData}
              series={TECH_SERIES}
              yMin={0} yMax={100}
              yUnit="%"
              height={260}
            />
          </CardContent>
        </Card>
      )}

      {/* ─── Physical evolution ──────────────────────────────────────── */}
      {hasPhys && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolución Física</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-6 ${physCount === 1 ? 'grid-cols-1' : physCount === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
              {hasCMJ && (
                <div>
                  <p className="text-xs font-medium text-center text-muted-foreground mb-1">
                    Salto CMJ — mejor marca
                    <span className="text-emerald-500 ml-1">↑ cm</span>
                  </p>
                  <SvgLineChart
                    data={chartData}
                    series={[{ key: 'bestCMJ', name: 'CMJ', color: '#10b981', strokeWidth: 2 }]}
                    yMin={cmjMin} yMax={cmjMax}
                    yUnit=" cm"
                    height={180}
                  />
                </div>
              )}

              {hasVel && (
                <div>
                  <p className="text-xs font-medium text-center text-muted-foreground mb-1">
                    Velocidad 10 m — mejor marca
                    <span className="text-amber-500 ml-1">↓ s</span>
                  </p>
                  <SvgLineChart
                    data={chartData}
                    series={[{ key: 'bestVel10m', name: 'Vel. 10m', color: '#f59e0b', strokeWidth: 2 }]}
                    yMin={velMin} yMax={velMax}
                    yUnit=" s"
                    height={180}
                  />
                </div>
              )}

              {hasBolas && (
                <div>
                  <p className="text-xs font-medium text-center text-muted-foreground mb-1">
                    8 Bolas Lateral — mejor marca
                    <span className="text-violet-400 ml-1">↓ s</span>
                  </p>
                  <SvgLineChart
                    data={chartData}
                    series={[{ key: 'bestBolasLateral', name: 'Bolas Lat.', color: '#8b5cf6', strokeWidth: 2 }]}
                    yMin={bolasMin} yMax={bolasMax}
                    yUnit=" s"
                    height={180}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
